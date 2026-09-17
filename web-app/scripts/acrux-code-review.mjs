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
  return process.platform === "win32" ? `${name}.cmd` : name;
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
  const options = { pr: null, noPost: false, yes: false };
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
    ["pr", "view", number, "--json", "number,title,url,baseRefName,baseRefOid,headRefName"],
    repositoryRoot,
  );
  return JSON.parse(json);
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
      "-o",
      reviewPath,
      "-",
    ],
    repositoryRoot,
    instructions,
  );
  const review = await readFile(reviewPath, "utf8");
  if (!review.trim()) throw new Error("A revisão retornou vazia.");
  return { review, reviewPath };
}

async function buildComment(pullRequest, review) {
  const generatedAt = new Date().toISOString();
  return `${reviewMarker}\n## Acrux Code Review — PR #${pullRequest.number}\n\n${review.trim()}\n\n_Revisão gerada em ${generatedAt}._`;
}

async function publishComment(pullRequest, body, repositoryName, temporaryDirectory) {
  const commentPath = path.join(temporaryDirectory, "acrux-comment.md");
  await writeFile(commentPath, body, "utf8");
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
  const existing = comments.find((comment) => comment.body?.includes(reviewMarker));
  if (existing) {
    const updated = await readCommand(
      "gh",
      [
        "api",
        "--method",
        "PATCH",
        `repos/${repositoryName}/issues/comments/${existing.id}`,
        "-F",
        `body=@${commentPath}`,
        "--jq",
        ".html_url",
      ],
      repositoryRoot,
    );
    console.log(`Comentário Acrux atualizado: ${updated}`);
    return;
  }
  await runCommand(
    "gh",
    ["pr", "comment", String(pullRequest.number), "--body-file", commentPath],
    repositoryRoot,
  );
  console.log("Comentário Acrux publicado na PR.");
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
    const comment = await buildComment(pullRequest, review);
    console.log("\n--- Resultado da revisão Acrux ---\n");
    console.log(review.trim());
    if (await shouldPublish(options))
      await publishComment(pullRequest, comment, repositoryName, worktreePath);
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
