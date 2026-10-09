import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { getMachineLearningPages } from "../src/entities/documentation/data/machine-learning-pages.ts";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const snapshotUrl = new URL("../src/entities/documentation/data/model-evidence.json", import.meta.url);
const snapshot = JSON.parse(await readFile(snapshotUrl, "utf8"));
const read = (path) => readFile(resolve(repo, path), "utf8");
const json = async (path) => JSON.parse(await read(path));
const hash = (text) => createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex");

// CSV quoting is needed for research tables; preserve decimal strings verbatim.
function parseCsv(text) {
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (c === "," && !quoted) { row.push(field); field = ""; }
    else if (c === "\n" && !quoted) { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift();
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}
const csv = async (path) => parseCsv(await read(path));
const supervisedRoot = "machine-learning/supervised-learning/data/resultados";
const runRoot = `machine-learning/outputs/model-comparison/${snapshot.unsupervised.run}`;
const artifactPath = "model-engine/models/supervised/assets/olimpo-svm-spacy-chi2k10k-svd500-v1.json";
const runPath = `${runRoot}/run_manifest.json`;
const selected = (row) => row.config === "M2" && row.k_chi2 === "10000" && row.d_svd === "500";
const artifact = await json(artifactPath);
let artifactBytes = snapshot.supervised.bytes;
try {
  const binary = await readFile(resolve(repo, "model-engine/models/supervised/assets", artifact.arquivo));
  assert.equal(createHash("sha256").update(binary).digest("hex"), artifact.sha256, "Artifact hash mismatch");
  artifactBytes = binary.length;
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  console.warn("Joblib absent locally: retaining audited byte count; binary hash was not rechecked.");
}
const run = await json(runPath);
const catalog = await json("model-engine/models/unsupervised/assets/product_catalog.json");
const cv = await csv(`${supervisedRoot}/resultados_selectk_svd500_cv.csv`);
const tests = await csv(`${supervisedRoot}/resultados_selectk_svd500_teste.csv`);
const paths = [...new Set([...snapshot.sourceFiles.map((entry) => entry.path), artifactPath, runPath])];
const current = {
  ...snapshot,
  sourceFiles: await Promise.all(paths.map(async (path) => ({ path, sha256: hash(await read(path)) }))),
  supervised: {
    artifact,
    serving: await json("model-engine/models/supervised/assets/serving_manifest.json"),
    crossValidation: cv.find(selected), tests: tests.filter(selected),
    bytes: artifactBytes,
  },
  unsupervised: {
    run: snapshot.unsupervised.run, variant: snapshot.unsupervised.variant,
    corpus: run.corpus, parameters: run.parameters, environment: run.environment,
    partitions: Object.fromEntries(Object.entries(run.partitions.canonical_random_group).map(([name, value]) => [name, value.counts])),
    bootstrap: run.bootstrap, reviewPolicy: run.review_policy,
    variantResults: await csv(`${runRoot}/variant_summary.csv`),
    thresholds: (await csv(`${runRoot}/${snapshot.unsupervised.variant}/discretization.csv`)).filter((row) => row.direction === "baixo").map((row) => ({
      feature: row.feature, low: row.low_threshold, high: row.high_threshold, omitted: row.omitted === "True",
    })),
    catalogVersion: catalog.catalogVersion, catalogStatus: catalog.status,
    patternCount: catalog.patterns.length, comparisonExample: catalog.patterns[0].comparison,
    productPatterns: catalog.patterns.map((pattern) => ({
      patternId: pattern.patternId,
      items: pattern.items.map(({ feature, operator, threshold }) => ({ feature, operator, threshold })),
      fake: pattern.comparison.fake, true: pattern.comparison.true,
    })),
  },
};

// Recompute all test macro F1 values from confusion matrices, allowing CSV rounding.
for (const row of tests) {
  const { tn, fp, fn, tp } = Object.fromEntries(["tn", "fp", "fn", "tp"].map((key) => [key, Number(row[key])]));
  const macroF1 = (2 * tn / (2 * tn + fp + fn) + 2 * tp / (2 * tp + fp + fn)) / 2;
  assert.ok(Math.abs(macroF1 - Number(row.f1_macro)) <= 0.00000051, `F1 mismatch: ${row.conjunto}/${row.config}/${row.k_chi2}/${row.d_svd}`);
}
const partitions = Object.values(run.partitions.canonical_random_group);
for (let i = 0; i < partitions.length; i++) {
  for (let j = i + 1; j < partitions.length; j++) {
    const groups = new Set(partitions[i].group_ids);
    assert.ok(partitions[j].group_ids.every((id) => !groups.has(id)), "Groups overlap between splits");
  }
}
for (const pattern of current.unsupervised.productPatterns) {
  for (const label of ["fake", "true"]) {
    const { count, total, frequency } = pattern[label];
    assert.ok(total > 0 && count >= 0 && count <= total && Math.abs(count / total - frequency) < 1e-12, `Invalid ${pattern.patternId}/${label} frequency`);
  }
}

if (process.argv.includes("--update")) {
  current.verifiedOn = new Date().toISOString().slice(0, 10);
  await writeFile(snapshotUrl, `${JSON.stringify(current, null, 2)}\n`);
  console.log("Snapshot updated. Review narrative and translations, then rerun without --update.");
} else {
  assert.deepEqual(snapshot, current, "Documentation evidence differs from repository sources. Review changes before updating.");
  const referencePages = getMachineLearningPages("pt-BR");
  for (const locale of ["pt-BR", "en", "es"]) {
    const pages = getMachineLearningPages(locale);
    assert.deepEqual(pages.map((page) => page.slug), referencePages.map((page) => page.slug));
    for (const [index, page] of pages.entries()) {
      assert.deepEqual(page.sections.map((section) => section.id), referencePages[index].sections.map((section) => section.id));
      assert.equal(new Set(page.sections.map((section) => section.id)).size, page.sections.length);
      for (const section of page.sections) {
        for (const block of section.blocks) {
          if (block.type === "table") assert.ok(block.rows.every((row) => row.length === block.headers.length), `${locale}/${page.slug}/${section.id}: malformed table`);
          if (block.type === "references") {
            for (const item of block.items) {
              const prefix = `https://github.com/LucasSilvaC/olimpo-fake-news-ai/blob/${snapshot.sourceRef}/`;
              if (item.href.startsWith(prefix)) await access(resolve(repo, item.href.slice(prefix.length)));
            }
          }
        }
      }
    }
  }
  console.log(`Verified ${paths.length} source hashes, ${tests.length} confusion matrices, split isolation, class frequencies and six localized guides.`);
}
