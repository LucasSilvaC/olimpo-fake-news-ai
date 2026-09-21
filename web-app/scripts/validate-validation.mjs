import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const validationDirectory = "validation";
const sourceFiles = ["fallback-results.json", "json-ld-source.json", "live-results.json"];

const manifest = {
  files: [],
};

for (const fileName of sourceFiles) {
  const content = await readFile(join(validationDirectory, fileName));
  JSON.parse(content);
  manifest.files.push({
    name: fileName,
    sha256: createHash("sha256").update(content).digest("hex"),
    bytes: content.byteLength,
  });
}

await writeFile(
  join(validationDirectory, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`Validated ${manifest.files.length} validation artifacts.`);
