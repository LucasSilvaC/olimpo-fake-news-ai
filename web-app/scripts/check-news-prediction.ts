import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer, request as proxyRequest } from "node:http";

import { chromium } from "@playwright/test";
import { SignJWT } from "jose";
import postgres from "postgres";

import { RoomPin } from "../src/app/api/rooms/entities/room-pin.vo";
import { parseHtml } from "../src/lib/news/extract-news";

// Require an explicit disposable database: never infer the game's DATABASE_URL.
async function main() {
  const databaseUrl = process.env.NEWS_PREDICTION_SMOKE_DATABASE_URL;
  if (!databaseUrl)
    throw new Error("Set NEWS_PREDICTION_SMOKE_DATABASE_URL to an isolated migrated database.");
  const baseUrl = process.env.NEWS_PREDICTION_SMOKE_APP_URL ?? "http://127.0.0.1:3309";
  const secret = "isolated-supervised-validation-secret-32-chars";
  const sql = postgres(databaseUrl, { max: 1 });
  const suffix = randomUUID();
  const host = `prediction-host-${suffix}`;
  const guest = `prediction-guest-${suffix}`;
  const outsider = `prediction-outsider-${suffix}`;
  const roomId = `prediction-room-${suffix}`;
  const articleId = `prediction-article-${suffix}`;
  const pin = RoomPin.generate();
  const body =
    "Os pesquisadores publicaram 20 documentos sobre a qualidade da água. A equipe da universidade informou que as medições ocorreram durante três meses. O relatório apresenta os dados coletados e descreve os procedimentos utilizados. A população pode consultar os documentos e comparar as medições com pesquisas anteriores. ".repeat(
      4,
    );
  const article = parseHtml(
    `<html lang="pt-BR"><head><title>Pesquisa da água</title></head><body><article><h1>Pesquisa da água</h1><p>${body}</p></article></body></html>`,
    "https://example.com/prediction-fixture",
  );
  assert.ok(article.content.length >= 300);
  let failSupervised = false;
  const motorUrl = process.env.NEWS_PREDICTION_SERVICE_URL ?? "http://127.0.0.1:58019";
  const proxy = createServer((incoming, outgoing) => {
    if (failSupervised && incoming.url?.includes("supervised")) {
      outgoing.writeHead(503, { "Content-Type": "application/json" });
      outgoing.end(JSON.stringify({ status: "unavailable" }));
      return;
    }
    const upstream = proxyRequest(
      new URL(incoming.url ?? "/", motorUrl),
      {
        method: incoming.method,
        headers: incoming.headers,
      },
      (response) => {
        outgoing.writeHead(response.statusCode ?? 503, response.headers);
        response.pipe(outgoing);
      },
    );
    upstream.on("error", () => {
      outgoing.writeHead(503);
      outgoing.end();
    });
    incoming.pipe(upstream);
  });
  await new Promise<void>((resolve) =>
    proxy.listen(Number(process.env.NEWS_PREDICTION_SMOKE_PROXY_PORT) || 0, "0.0.0.0", resolve),
  );
  const proxyAddress = proxy.address();
  assert.ok(proxyAddress && typeof proxyAddress !== "string");
  const proxyUrl = `http://127.0.0.1:${proxyAddress.port}`;
  const app =
    process.env.NEWS_PREDICTION_SMOKE_START_APP === "0"
      ? undefined
      : spawn(
          process.execPath,
          [
            "node_modules/next/dist/bin/next",
            "start",
            "--hostname",
            "127.0.0.1",
            "--port",
            new URL(baseUrl).port,
          ],
          {
            stdio: "inherit",
            windowsHide: true,
            env: {
              ...process.env,
              DATABASE_URL: databaseUrl,
              AUTH_SECRET: secret,
              REDIS_URL: process.env.NEWS_PREDICTION_SMOKE_REDIS_URL ?? "redis://127.0.0.1:56389",
              NEWS_PREDICTION_SERVICE_URL: proxyUrl,
              NEWS_INSIGHTS_SERVICE_URL: proxyUrl,
            },
          },
        );
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    const deadline = Date.now() + 30_000;
    while (true) {
      try {
        if ((await fetch(`${baseUrl}/api/health`)).ok) break;
      } catch {
        /* startup */
      }
      if ((app && app.exitCode !== null) || Date.now() > deadline)
        throw new Error("Isolated app did not become ready");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    await sql`insert into users (id,name,email,password_hash) values
      (${host},'Anfitrião teste',${`${host}@test.invalid`},'not-a-password'),
      (${guest},'Participante teste',${`${guest}@test.invalid`},'not-a-password'),
      (${outsider},'Visitante teste',${`${outsider}@test.invalid`},'not-a-password')`;
    await sql`insert into rooms (id,pin,name,status,round_duration_seconds,current_round,total_rounds,host_id)
      values (${roomId},${pin},'Integração supervisionada','in_progress',600,1,2,${host})`;
    await sql`insert into room_members (id,room_id,user_id,role) values
      (${randomUUID()},${roomId},${host},'host'),(${randomUUID()},${roomId},${guest},'participant')`;
    await sql`insert into news_articles (id,article,target_classification) values
      (${articleId},${sql.json(article as unknown as postgres.JSONValue)},'uncertain')`;
    for (const round of [1, 2])
      await sql`insert into room_playlist_items (id,room_id,article_id,round_order) values (${randomUUID()},${roomId},${articleId},${round})`;
    const token = (id: string) =>
      new SignJWT({ id, name: id, email: `${id}@test.invalid` })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(id)
        .setIssuedAt()
        .setExpirationTime("10m")
        .sign(new TextEncoder().encode(secret));
    const hostToken = await token(host);
    const request = (payload: unknown, authToken?: string, route = "news-prediction") =>
      fetch(`${baseUrl}/api/${route}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Cookie: `auth_token=${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
    assert.equal((await request({ roomId, round: 1 })).status, 401);
    assert.equal((await request({ roomId, round: 1 }, await token(outsider))).status, 403);
    assert.equal((await request({ roomId, round: 1, text: "override" }, hostToken)).status, 400);
    assert.equal((await request({ roomId, round: 1 }, hostToken)).status, 409);
    const insights = await request({ roomId, round: 1 }, hostToken, "news-insights");
    assert.equal(insights.status, 200);
    assert.equal((await insights.json()).analysis.analysisStatus, "ok");
    browser = await chromium.launch({ headless: true });
    const hostContext = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const guestContext = await browser.newContext();
    await hostContext.addCookies([
      { name: "auth_token", value: hostToken, url: baseUrl, httpOnly: true, sameSite: "Lax" },
    ]);
    await guestContext.addCookies([
      {
        name: "auth_token",
        value: await token(guest),
        url: baseUrl,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const page = await hostContext.newPage();
    const guestPage = await guestContext.newPage();
    const pageUrl = `${baseUrl}/sala/${encodeURIComponent(pin)}`;
    await Promise.all([page.goto(pageUrl), guestPage.goto(pageUrl)]);
    assert.equal(await page.getByText("Análise do modelo", { exact: true }).count(), 0);
    assert.doesNotMatch(
      await page.content(),
      /123763864725531f12aa0503530edce432ca6e59853d36ef472559790207df27/,
    );
    await page.getByRole("button", { name: "Classificar notícia como Incerta" }).click();
    await page.locator('[data-purpose="waiting-state-container"]').waitFor();
    assert.equal(
      (await request({ roomId, round: 1 }, hostToken)).status,
      409,
      "One player's vote must not release prediction",
    );
    await guestPage.getByRole("button", { name: "Classificar notícia como Incerta" }).click();
    await page.getByText("Análise do modelo", { exact: true }).waitFor();
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request({ roomId, round: 1 }, hostToken)),
    );
    const results = await Promise.all(
      responses.map(async (response) => {
        assert.equal(response.status, 200);
        return response.json();
      }),
    );
    const analysis = results[0].modelAnalysis;
    assert.equal(analysis.analysisStatus, "ok");
    assert.ok(analysis.fakeProbability >= 0 && analysis.fakeProbability <= 1);
    assert.ok(Math.abs(analysis.fakeScore - 100 * analysis.fakeProbability) < 1e-8);
    assert.notEqual(analysis.modelVersion, "mock-v1");
    for (const result of results) assert.equal(result.modelAnalysis.id, analysis.id);
    const count =
      await sql`select count(*)::int as count from news_analyses where article_id=${articleId}`;
    assert.equal(count[0]?.count, 1, "Concurrent requests must persist one analysis");
    const votes = await sql`select vote,points_awarded from news_votes where room_id=${roomId}`;
    assert.equal(votes.length, 2);
    assert.ok(
      votes.every((vote) => vote.points_awarded > 0),
      "Scoring must use registered uncertain answer",
    );
    await page.getByText("Análise do modelo", { exact: true }).waitFor();
    await mkdir("validation/news-prediction", { recursive: true });
    await page.screenshot({ path: "validation/news-prediction/desktop.png", fullPage: true });
    await page.reload();
    await page.getByText("Análise do modelo", { exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({ path: "validation/news-prediction/mobile.png", fullPage: true });
    const details = page.getByText("Preparo, versões e limitações", { exact: true });
    await details.focus();
    await page.keyboard.press("Enter");
    await page.getByText(analysis.artifactSha256, { exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    await page.screenshot({
      path: "validation/news-prediction/mobile-details.png",
      fullPage: true,
    });
    await page.keyboard.press("Enter");
    await page.setViewportSize({ width: 1440, height: 1100 });
    if (!(await page.locator('[data-purpose="round-scoreboard-stage"]').count())) {
      await page
        .getByRole("button", { name: /Ver placar agora|Ir para o Placar da Rodada/i })
        .first()
        .click();
    }
    await page.locator('[data-purpose="round-scoreboard-stage"]').waitFor();
    await page.getByRole("button", { name: "Avançar para Próxima Rodada" }).click();
    await page.getByRole("button", { name: "Classificar notícia como Incerta" }).waitFor();
    assert.equal((await request({ roomId, round: 2 }, hostToken)).status, 409);
    assert.equal(await page.getByText("Análise do modelo", { exact: true }).count(), 0);
    failSupervised = true;
    await page.getByRole("button", { name: "Classificar notícia como Incerta" }).click();
    await guestPage.getByRole("button", { name: "Classificar notícia como Incerta" }).waitFor();
    await guestPage.getByRole("button", { name: "Classificar notícia como Incerta" }).click();
    await page
      .getByText("A análise do modelo está indisponível. Você pode continuar o jogo.")
      .waitFor();
    const failedResponse = await request({ roomId, round: 2 }, hostToken);
    assert.equal(failedResponse.status, 200);
    const failedAnalysis = (await failedResponse.json()).modelAnalysis;
    assert.equal(failedAnalysis.analysisStatus, "unavailable");
    assert.equal(failedAnalysis.fakeScore, null);
    const allVotes = await sql`select points_awarded from news_votes where room_id=${roomId}`;
    assert.equal(allVotes.length, 4);
    assert.ok(allVotes.every((vote) => vote.points_awarded > 0));
    await page.screenshot({ path: "validation/news-prediction/unavailable.png", fullPage: true });
    if (!(await page.locator('[data-purpose="round-scoreboard-stage"]').count())) {
      await page
        .getByRole("button", { name: /Ver placar agora|Ir para o Placar da Rodada/i })
        .first()
        .click();
    }
    await page.getByRole("button", { name: "Ver Classificação Final" }).click();
    await page.locator('[data-purpose="match-scoreboard-stage"]').waitFor();
    await writeFile(
      "validation/news-prediction/result.json",
      JSON.stringify(
        {
          status: "passed",
          parser: "real_html",
          model: "real",
          isolatedDatabase: true,
          accessBeforeCollectiveClose: "blocked",
          concurrentRequests: 5,
          records: 1,
          fakeProbability: analysis.fakeProbability,
          modelVersion: analysis.modelVersion,
          artifactSha256: analysis.artifactSha256,
          desktopMobileReloadNextRound: "passed",
          modelFailureVotesScoreAndMatchCompletion: "passed",
        },
        null,
        2,
      ),
    );
    console.log("Supervised integration check passed");
  } finally {
    await browser?.close();
    app?.kill();
    proxy.closeAllConnections();
    await new Promise<void>((resolve) => proxy.close(() => resolve()));
    await sql`delete from users where id in (${host},${guest},${outsider})`;
    await sql`delete from news_articles where id=${articleId}`;
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
