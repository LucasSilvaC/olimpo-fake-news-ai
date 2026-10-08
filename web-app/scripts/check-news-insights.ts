import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";
import { SignJWT } from "jose";
import postgres from "postgres";

import { RoomPin } from "../src/app/api/rooms/entities/room-pin.vo";
import { parseHtml } from "../src/lib/news/extract-news";
import type { NewsInsightsResponse } from "../src/lib/news-insights/types";

// Explicitly opt into an isolated migrated database; never use DATABASE_URL implicitly.
async function main(): Promise<void> {
  const databaseUrl = process.env.NEWS_INSIGHTS_SMOKE_DATABASE_URL;
  if (!databaseUrl)
    throw new Error("Set NEWS_INSIGHTS_SMOKE_DATABASE_URL to an isolated test database.");
  const baseUrl = process.env.NEWS_INSIGHTS_SMOKE_APP_URL ?? "http://127.0.0.1:3000";
  const startApp = process.env.NEWS_INSIGHTS_SMOKE_START_APP === "1";
  const secret = startApp
    ? "isolated-insights-validation-secret-32-chars"
    : process.env.AUTH_SECRET;
  if (!secret) throw new Error("Set AUTH_SECRET to the same value used by the running app.");
  const sql = postgres(databaseUrl, { max: 1 });
  const suffix = randomUUID();
  const userId = `insights-smoke-${suffix}`;
  const outsiderId = `insights-outsider-${suffix}`;
  const roomId = `insights-room-${suffix}`;
  const articleId = `insights-article-${suffix}`;
  const pin = RoomPin.generate();
  const body =
    "Os pesquisadores publicaram 20 documentos sobre a qualidade da água. " +
    "A equipe da universidade informou que as medições ocorreram durante três meses. " +
    "O relatório apresenta os dados coletados e descreve os procedimentos utilizados. " +
    "A população pode consultar os documentos e comparar as medições com pesquisas anteriores. ".repeat(
      4,
    );
  const article = parseHtml(
    `<html lang="pt-BR"><head><title>Documentos da pesquisa</title></head><body>` +
      `<article><h1>Documentos da pesquisa</h1><p>${body}</p></article></body></html>`,
    "https://example.com/insights-fixture",
  );
  assert.ok(article.content.length >= 300, "Real HTML parser must extract the fixture body");
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  const app = startApp
    ? spawn(
        process.execPath,
        [
          "node_modules/next/dist/bin/next",
          "start",
          "--hostname",
          "127.0.0.1",
          "--port",
          new URL(baseUrl).port || "3000",
        ],
        {
          stdio: "inherit",
          windowsHide: true,
          env: {
            ...process.env,
            DATABASE_URL: databaseUrl,
            AUTH_SECRET: secret,
            REDIS_URL: process.env.NEWS_INSIGHTS_SMOKE_REDIS_URL ?? "redis://127.0.0.1:56379",
            NEWS_INSIGHTS_SERVICE_URL:
              process.env.NEWS_INSIGHTS_SERVICE_URL ?? "http://127.0.0.1:8010",
          },
        },
      )
    : undefined;
  try {
    if (app) {
      const deadline = Date.now() + 30_000;
      while (true) {
        try {
          if ((await fetch(`${baseUrl}/api/health`)).ok) break;
        } catch {
          /* Wait for the isolated local test server. */
        }
        if (app.exitCode !== null || Date.now() > deadline)
          throw new Error("Isolated app did not become ready");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    await sql`insert into users (id,name,email,password_hash) values
      (${userId},'Leitor de teste',${`${suffix}@insights.test`},'not-a-login-password'),
      (${outsiderId},'Visitante de teste',${`${suffix}@outsider.test`},'not-a-login-password')`;
    await sql`insert into rooms (id,pin,name,status,round_duration_seconds,current_round,total_rounds,host_id)
      values (${roomId},${pin},'Validação dos insights','in_progress',600,1,1,${userId})`;
    await sql`insert into room_members (id,room_id,user_id,role) values
      (${randomUUID()},${roomId},${userId},'host')`;
    await sql`insert into news_articles (id,article,target_classification)
      values (${articleId},${sql.json(article as unknown as postgres.JSONValue)},'uncertain')`;
    await sql`insert into room_playlist_items (id,room_id,article_id,round_order)
      values (${randomUUID()},${roomId},${articleId},1)`;
    const makeToken = (id: string) =>
      new SignJWT({ id, name: "Leitor de teste", email: "test@insights.test" })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(id)
        .setIssuedAt()
        .setExpirationTime("10m")
        .sign(new TextEncoder().encode(secret));
    const token = await makeToken(userId);
    const request = (payload: unknown, authToken?: string) =>
      fetch(`${baseUrl}/api/news-insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Cookie: `auth_token=${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
    assert.equal((await request({ roomId, round: 1 })).status, 401);
    assert.equal((await request({ roomId, round: 1 }, await makeToken(outsiderId))).status, 403);
    assert.equal((await request({ roomId, round: 2 }, token)).status, 409);
    assert.equal((await request({ roomId, round: 1, text: "override" }, token)).status, 400);
    const response = await request({ roomId, round: 1 }, token);
    assert.equal(response.status, 200);
    const result = (await response.json()) as NewsInsightsResponse;
    assert.equal(result.article.content, article.content);
    assert.equal(
      result.analysis.analysisStatus,
      "ok",
      "Real model must be ready and match this fixture",
    );
    assert.equal(
      result.analysis.analyzedText,
      article.content
        .normalize("NFKC")
        .replace(/^\uFEFF+/, "")
        .slice(0, 300),
    );
    assert.ok(result.analysis.insights.length >= 1 && result.analysis.insights.length <= 3);
    for (const insight of result.analysis.insights) {
      assert.equal(insight.comparison.kind, "descriptive_corpus_frequency");
      assert.equal(insight.comparison.partition, "validation");
      assert.equal(insight.comparison.scope, "matched_pattern");
      for (const group of [insight.comparison.fake, insight.comparison.true]) {
        assert.equal(group.total, 720);
        assert.ok(group.count >= 0 && group.count <= group.total);
        assert.ok(Math.abs(group.frequency - group.count / group.total) < 1e-9);
      }
    }
    assert.equal(
      new Set(result.analysis.insights.map((i) => i.redundancyFamily)).size,
      result.analysis.insights.length,
    );
    assert.doesNotMatch(
      JSON.stringify(result.analysis),
      /classComparison|classification|confidence|composition_fake/,
    );

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    await context.addCookies([
      { name: "auth_token", value: token, url: baseUrl, httpOnly: true, sameSite: "Lax" },
    ]);
    const page = await context.newPage();
    const analysisResponse = page.waitForResponse(
      (r) => r.url().endsWith("/api/news-insights") && r.request().method() === "POST",
    );
    await page.goto(`${baseUrl}/sala/${encodeURIComponent(pin)}`);
    assert.equal((await analysisResponse).status(), 200);
    assert.equal(
      await page.getByRole("button", { name: "Classificar notícia como Incerta" }).isEnabled(),
      true,
    );
    assert.equal(await page.getByRole("dialog").count(), 0);
    await page.getByRole("button", { name: "Abrir observações sobre a escrita" }).click();
    await page.getByRole("dialog", { name: "Observe a escrita" }).waitFor();
    await page.getByText(result.analysis.insights[0]!.observation, { exact: true }).waitFor();
    const panel = page.locator('[data-purpose="news-insights"]');
    const collapsedText = await panel.innerText();
    assert.match(collapsedText, /rotuladas como falsas/);
    assert.match(collapsedText, /rotuladas como verdadeiras/);
    assert.doesNotMatch(collapsedText, /300|tokens|POS_|DEP_|<=|>=/);
    await page.getByText("Ver o trecho analisado e os detalhes", { exact: true }).click();
    await page.getByText(result.analysis.analyzedText, { exact: true }).waitFor();
    assert.doesNotMatch(
      await page.locator('[data-purpose="news-insights"]').innerText(),
      /78%|chance de ser falsa|Fake\/True/,
    );
    await page.getByText("Ver o trecho analisado e os detalhes", { exact: true }).click();
    await panel.getByText("Ver contagens e referência", { exact: true }).first().click();
    await panel
      .getByText(/Referência: Fake\.br-Corpus, amostra de validação/)
      .first()
      .waitFor();
    await panel.getByText("Ver contagens e referência", { exact: true }).first().click();
    await mkdir("validation/news-insights", { recursive: true });
    await page.screenshot({ path: "validation/news-insights/desktop.png", fullPage: true });
    await page.mouse.click(1400, 100);
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.screenshot({
      path: "validation/news-insights/desktop-collapsed.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Abrir observações sobre a escrita" }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({ path: "validation/news-insights/mobile.png", fullPage: true });
    await page.getByRole("button", { name: "Fechar observações sobre a escrita" }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.screenshot({
      path: "validation/news-insights/mobile-collapsed.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Abrir observações sobre a escrita" }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Classificar notícia como Incerta" }).click();
    await page.locator('[data-purpose="waiting-state-container"]').waitFor();
    assert.equal(await page.locator('[data-purpose="ai-analysis-reasons"]').count(), 0);
    console.log(
      JSON.stringify({
        status: "passed",
        parser: "real",
        model: "real",
        authenticatedApi: "passed",
        vote: "passed",
        insights: result.analysis.insights.length,
        screenshots: path.resolve("validation/news-insights"),
      }),
    );
  } finally {
    await browser?.close();
    app?.kill();
    await sql`delete from users where id in (${userId},${outsiderId})`;
    await sql`delete from news_articles where id=${articleId}`;
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Integration check failed");
  process.exitCode = 1;
});
