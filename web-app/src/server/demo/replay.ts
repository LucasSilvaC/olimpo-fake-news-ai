import "server-only";

import { createHash } from "node:crypto";

import { getDemoNewsFixture } from "./demo-news";

import type { NewsArticle } from "@/server/shared/database/schemas";

/** A reserved fixture ID alone never authorizes replay of another article's results. */
export function verifyDemoArticle(saved: NewsArticle) {
  const fixture = getDemoNewsFixture(saved.id);
  if (!fixture) return null;
  const hash = createHash("sha256").update(saved.article.content, "utf8").digest("hex");
  if (hash !== fixture.bodySha256 || saved.targetClassification !== fixture.targetClassification) {
    throw new Error("O conteúdo preparado mudou. Recarregue os exemplos antes de jogar.");
  }
  return fixture;
}
