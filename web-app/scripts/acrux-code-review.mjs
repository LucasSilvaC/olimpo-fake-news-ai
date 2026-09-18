import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { stdin as input, stdout as output } from "node:process";
import { spawn } from "node:child_process";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const reviewMarker = "<!-- acrux-code-review -->";

function commandName(name) {
  if (process.platform !== "win32") return name;
  // gh and codex are commonly installed as .exe on Windows. With shell=true,
  // leaving these names bare lets the shell resolve either .exe or .cmd.
  if (name === "gh" || name === "codex" || name === "git") return name;
  return `${name}.cmd`;
}

function runCommand(command, args, cwd, inputText) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandName(command), args, {
      cwd,
      shell: process.platform === "win32",
      windowsHide: true,
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    if (inputText === undefined) child.stdin.end();
    else {
      child.stdin.write(inputText);
      child.stdin.end();
    }
    child.on("error", reject);
    child.on("close", (code) => {
      const result = {
        code: code ?? 1,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      };
      if (result.code !== 0) {
        reject(new Error(`${command} falhou (${result.code}): ${result.stderr || result.stdout}`));
        return;
      }
      resolve(result);
    });
  });
}

async function readCommand(command, args, cwd) {
  const result = await runCommand(command, args, cwd);
  return result.stdout.trim();
}

function parseArguments(argumentsList) {
  const options = { pr: null, noPost: false, yes: false, allowDuplicate: false };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    if (argument === "--no-post") {
      options.noPost = true;
      continue;
    }
    if (argument === "--yes" || argument === "-y") {
      options.yes = true;
      continue;
    }
    if (argument === "--allow-duplicate") {
      options.allowDuplicate = true;
      continue;
    }
    if (argument === "--pr") {
      options.pr = argumentsList[index + 1];
      index += 1;
      continue;
    }
    throw new Error(`Argumento desconhecido: ${argument}`);
  }
  return options;
}

function printHelp() {
  console.log(`Uso: node scripts/acrux-code-review.mjs [opções]

Revisa a PR aberta mais recentemente usando a skill code-review do Acrux
e publica um comentário sucinto no GitHub após confirmação.

Opções:
  --pr <número|url>  Sugere uma PR específica na pergunta interativa
  --no-post          Não publica o comentário; apenas mostra o resultado
  --yes, -y          Confirma a publicação sem perguntar
  --allow-duplicate  Permite nova revisão mesmo se já houver uma Acrux submetida
  --help, -h         Mostra esta ajuda`);
}

async function ask(question, fallback) {
  if (!input.isTTY) return fallback;
  const interfaceReader = readline.createInterface({ input, output });
  try {
    const answer = await interfaceReader.question(question);
    return answer.trim() || fallback;
  } finally {
    interfaceReader.close();
  }
}

function parsePullRequestNumber(reference) {
  const value = String(reference ?? "").trim();
  const urlMatch = value.match(/\/pull\/(\d+)(?:[/?#]|$)/i);
  const number = urlMatch?.[1] ?? value.replace(/^#/, "");
  if (!/^\d+$/.test(number)) throw new Error("Informe o número ou a URL de uma PR válida.");
  return number;
}

async function findAcruxRoot() {
  const candidates = [
    process.env.ACRUX_ROOT,
    path.join(os.homedir(), ".acrux"),
    path.resolve(repositoryRoot, "..", "Acrux-Agent"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    const promptPath = path.join(candidate, "prompts", "review", "code-review.md");
    const workflowPath = path.join(candidate, "workflows", "code-review.md");
    try {
      const [prompt, workflow] = await Promise.all([
        readFile(promptPath, "utf8"),
        readFile(workflowPath, "utf8"),
      ]);
      return { root: candidate, prompt, workflow };
    } catch {
      continue;
    }
  }
  throw new Error(
    "Não encontrei o Acrux. Defina ACRUX_ROOT apontando para a raiz que contém prompts/review/code-review.md.",
  );
}

async function getLatestPullRequest() {
  const result = await readCommand(
    "gh",
    ["pr", "list", "--state", "open", "--limit", "100", "--json", "number,title,url,updatedAt"],
    repositoryRoot,
  );
  const pullRequests = JSON.parse(result).sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
  if (!pullRequests.length) throw new Error("Não encontrei PRs abertas neste repositório.");
  return pullRequests[0];
}

async function selectPullRequest(options, latest) {
  console.log(`PR aberta mais recentemente: #${latest.number} — ${latest.title}`);
  console.log(`${latest.url} (atualizada em ${latest.updatedAt})`);
  const suggested = options.pr ? parsePullRequestNumber(options.pr) : String(latest.number);
  const reference = await ask(
    "Qual PR devo revisar? Enter confirma a sugerida, ou digite número/URL (q cancela): ",
    suggested,
  );
  if (reference.toLowerCase() === "q") throw new Error("Operação cancelada.");
  return parsePullRequestNumber(reference);
}

async function getPullRequest(number) {
  const json = await readCommand(
    "gh",
    ["pr", "view", number, "--json", "number,title,url,baseRefName,baseRefOid,headRefName,headRefOid"],
    repositoryRoot,
  );
  return JSON.parse(json);
}

function parseInlineReview(review) {
  const text = review.trim();
  const findingsStart = text.search(/^##?\s+Findings\b/im);
  if (findingsStart < 0) return { inline: [], unlocated: [], openQuestions: text };
  const afterFindings = text.slice(findingsStart);
  const nextSection = afterFindings.search(/^##?\s+(?!Findings\b)/im);
  const findingsText = (nextSection < 0 ? afterFindings : afterFindings.slice(0, nextSection)).trim();
  const remainder = nextSection < 0 ? "" : afterFindings.slice(nextSection).trim();
  const starts = [...findingsText.matchAll(/^(?:(?:###?\s+)|(?:[-*]\s+))(?=\*?\*?\[P\d\])/gim)].map(
    (match) => match.index,
  );
  const blocks = starts.length
    ? starts.map((start, index) => findingsText.slice(start, starts[index + 1]).trim())
    : [findingsText.replace(/^##?\s+Findings\s*/i, "").trim()];
  const locationPattern = /(?:^|[\s`(])((?:\/?[A-Za-z]:[\\/]|\/?\.\.?[\\/])?[A-Za-z0-9_@.-]+(?:[\\/][A-Za-z0-9_@.-]+)*\.[A-Za-z0-9_-]+):(\d+)/g;
  const inline = [];
  const unlocated = [];
  for (const block of blocks) {
    const locations = [...block.matchAll(locationPattern)];
    const location = locations[0];
    if (location) {
      inline.push({ path: normalizeReviewPath(location[1]), line: Number(location[2]), body: `${reviewMarker}\n${block}` });
    } else if (!/^##?\s+Findings\s*$/i.test(block)) {
      unlocated.push(block);
    }
  }
  return { inline, unlocated, remainder };
}

function normalizeReviewPath(value) {
  let candidate = value.replaceAll("\\", "/");
  if (/^\/([A-Za-z]:\/)/.test(candidate)) candidate = candidate.slice(1);
  if (/^[A-Za-z]:\//.test(candidate) || candidate.startsWith("/")) {
    candidate = path.relative(repositoryRoot, path.resolve(candidate)).replaceAll("\\", "/");
  }
  candidate = candidate.replace(/^\.\//, "");
  if (!candidate || candidate === ".." || candidate.startsWith("../") || /^[A-Za-z]:/.test(candidate)) {
    return value.replaceAll("\\", "/");
  }
  return candidate;
}

function changedPathForFinding(changedLines, findingPath) {
  const candidates = [
    findingPath,
    findingPath.replace(/^web-app\//, ""),
    `web-app/${findingPath.replace(/^web-app\//, "")}`,
  ];
  return candidates.find((candidate) => changedLines.has(candidate));
}

function changedLinesFromFiles(files) {
  const changed = new Map();
  for (const file of files) {
    if (!file.patch) continue;
    let currentLine = 0;
    for (const line of file.patch.split("\n")) {
      const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunk) {
        currentLine = Number(hunk[1]);
        continue;
      }
      if (line.startsWith("+") || line.startsWith(" ")) {
        if (!changed.has(file.filename)) changed.set(file.filename, new Set());
        changed.get(file.filename).add(currentLine);
        currentLine += 1;
      }
    }
  }
  return changed;
}

async function createReviewWorktree(number, baseOid) {
  const worktreePath = await mkdtemp(path.join(os.tmpdir(), "acrux-review-"));
  try {
    await runCommand("git", ["fetch", "--no-tags", "origin", baseOid], repositoryRoot);
    await runCommand(
      "git",
      ["fetch", "--no-tags", "origin", `+refs/pull/${number}/head`],
      repositoryRoot,
    );
    await runCommand(
      "git",
      ["worktree", "add", "--detach", worktreePath, "FETCH_HEAD"],
      repositoryRoot,
    );
    return worktreePath;
  } catch (error) {
    await rm(worktreePath, { recursive: true, force: true });
    throw error;
  }
}

function buildReviewInstructions(pullRequest, acrux) {
  return `Aplique a skill oficial do Acrux abaixo nesta revisão, sem alterar arquivos.

--- WORKFLOW Acrux ---
${acrux.workflow}
--- PROMPT code-review Acrux ---
${acrux.prompt}
--- FIM DA SKILL ---

Revise a PR #${pullRequest.number} (${pullRequest.title}) contra ${pullRequest.baseRefName} (${pullRequest.baseRefOid}).
Além da correção e regressões, verifique os principais padrões de clean code: nomes claros, funções pequenas e coesas, baixo acoplamento, tratamento de erros, duplicação, limites de camadas e testes comportamentais.
Escreva as descobertas em português, com linguagem natural e sucinta. Mantenha o formato de Findings/Open Questions/Summary da skill. Cite arquivo e linha sempre que possível. Não faça preâmbulo, elogios ou alterações no repositório.`;
}

async function runReview(pullRequest, worktreePath, acrux) {
  const reviewPath = path.join(worktreePath, "acrux-review.md");
  const instructions = buildReviewInstructions(pullRequest, acrux);
  try {
    await runCommand(
      "codex",
      [
        "-C",
        worktreePath,
        "--sandbox",
        "read-only",
        "exec",
        "--ephemeral",
        "review",
        "--base",
        pullRequest.baseRefOid,
        "--output-last-message",
        reviewPath,
        "-",
      ],
      repositoryRoot,
      instructions,
    );
  } catch (firstError) {
    // Some Codex versions reject a custom prompt together with --base on the
    // review subcommand. Use generic exec in the PR worktree and give it the
    // exact base diff to inspect instead.
    console.warn(`Formato exec review indisponível; tentando codex exec (${firstError.message}).`);
    const genericInstructions = `${instructions}

O subcomando review desta versão não aceita instruções customizadas com --base.
Revise exatamente as mudanças entre ${pullRequest.baseRefOid} e HEAD usando o diff do Git
(por exemplo: git diff --find-renames ${pullRequest.baseRefOid}...HEAD).`;
    await runCommand(
      "codex",
      [
        "-C",
        worktreePath,
        "--sandbox",
        "read-only",
        "exec",
        "--ephemeral",
        "--output-last-message",
        reviewPath,
        "-",
      ],
      repositoryRoot,
      genericInstructions,
    );
  }
  const review = await readFile(reviewPath, "utf8");
  if (!review.trim()) throw new Error("A revisão retornou vazia.");
  return { review, reviewPath };
}

async function buildComment(pullRequest, review, parsed) {
  const generatedAt = new Date().toISOString();
  const unlocated = parsed.unlocated.length
    ? `\n\n## Findings sem referência exata\n\n${parsed.unlocated.join("\n\n")}`
    : "";
  const remainder = parsed.remainder && !/^##?\s+Findings\b/i.test(parsed.remainder)
    ? `\n\n${parsed.remainder}`
    : "";
  return `${reviewMarker}\n## Acrux Code Review — PR #${pullRequest.number}\n\nOs findings com arquivo e linha foram publicados como comentários inline nesta revisão.${unlocated}${remainder}\n\n_Revisão gerada em ${generatedAt}._`;
}

async function publishComment(pullRequest, body, repositoryName, temporaryDirectory, options) {
  const parsed = parseInlineReview(body);
  const filesJson = await readCommand(
    "gh",
    ["api", `repos/${repositoryName}/pulls/${pullRequest.number}/files`, "--paginate", "--slurp"],
    repositoryRoot,
  );
  const changedLines = changedLinesFromFiles(JSON.parse(filesJson).flat());
  const validInline = [];
  for (const finding of parsed.inline) {
    const changedPath = changedPathForFinding(changedLines, finding.path);
    const lines = changedPath ? changedLines.get(changedPath) : undefined;
    if (changedPath && lines?.has(finding.line)) validInline.push({ ...finding, path: changedPath });
    else parsed.unlocated.push(`${finding.body.replace(`${reviewMarker}\n`, "")}\n\n(A linha indicada não está no diff atual; comentário mantido no resumo.)`);
  }
  const summary = await buildComment(pullRequest, body, parsed);
  const payloadPath = path.join(temporaryDirectory, "acrux-review-payload.json");
  const commentsJson = await readCommand(
    "gh",
    [
      "api",
      `repos/${repositoryName}/issues/${pullRequest.number}/comments`,
      "--paginate",
      "--slurp",
    ],
    repositoryRoot,
  );
  const comments = JSON.parse(commentsJson).flat();
  for (const comment of comments.filter((item) => item.body?.includes(reviewMarker))) {
    await runCommand("gh", ["api", "--method", "DELETE", `repos/${repositoryName}/issues/comments/${comment.id}`], repositoryRoot);
  }
  const reviewsJson = await readCommand(
    "gh",
    ["api", `repos/${repositoryName}/pulls/${pullRequest.number}/reviews`, "--paginate", "--slurp"],
    repositoryRoot,
  );
  const existingReviews = JSON.parse(reviewsJson).flat().filter((item) => item.body?.includes(reviewMarker));
  const submitted = existingReviews.filter((review) => String(review.state).toUpperCase() !== "PENDING");
  if (submitted.length && !options.allowDuplicate) {
    console.log("Já existe uma revisão Acrux submetida; o GitHub não permite excluí-la. Nenhuma duplicata foi publicada.");
    return;
  }
  for (const existing of existingReviews.filter((review) => String(review.state).toUpperCase() === "PENDING")) {
    await runCommand("gh", ["api", "--method", "DELETE", `repos/${repositoryName}/pulls/${pullRequest.number}/reviews/${existing.id}`], repositoryRoot);
  }
  const payload = {
    body: summary,
    commit_id: pullRequest.headRefOid,
    event: "COMMENT",
    comments: validInline.map(({ path: filePath, line, body: commentBody }) => ({ path: filePath, line, side: "RIGHT", body: commentBody })),
  };
  await writeFile(payloadPath, JSON.stringify(payload), "utf8");
  const created = await readCommand(
    "gh",
    ["api", "--method", "POST", `repos/${repositoryName}/pulls/${pullRequest.number}/reviews`, "--input", payloadPath, "--jq", ".html_url"],
    repositoryRoot,
  );
  console.log(`Revisão Acrux publicada com ${validInline.length} comentário(s) inline: ${created}`);
}

async function shouldPublish(options) {
  if (options.noPost) return false;
  if (options.yes) return true;
  if (!input.isTTY) return false;
  const answer = await ask("Publicar este comentário na PR? [S/n]: ", "s");
  return /^s(im)?$/i.test(answer);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  const acrux = await findAcruxRoot();
  console.log(`Acrux carregado de: ${acrux.root}`);
  const latest = await getLatestPullRequest();
  const number = await selectPullRequest(options, latest);
  const pullRequest = await getPullRequest(number);
  const repositoryName = await readCommand(
    "gh",
    ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"],
    repositoryRoot,
  );
  const worktreePath = await createReviewWorktree(number, pullRequest.baseRefOid);
  try {
    const { review } = await runReview(pullRequest, worktreePath, acrux);
    const comment = review;
    console.log("\n--- Resultado da revisão Acrux ---\n");
    console.log(review.trim());
    if (await shouldPublish(options))
      await publishComment(pullRequest, comment, repositoryName, worktreePath, options);
    else
      console.log(
        "Comentário não publicado. Use --yes para publicar automaticamente ou execute novamente.",
      );
  } finally {
    await runCommand("git", ["worktree", "remove", "--force", worktreePath], repositoryRoot).catch(
      () => {},
    );
    await rm(worktreePath, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`\nErro: ${error.message}`);
  process.exitCode = 1;
});
