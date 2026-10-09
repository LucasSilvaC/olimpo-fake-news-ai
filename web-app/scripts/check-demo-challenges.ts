import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";

import { chromium } from "@playwright/test";
import Redis from "ioredis";
import { SignJWT } from "jose";
import postgres from "postgres";

// Use only an explicitly selected disposable, migrated database.
async function main() {
  const databaseUrl = process.env.DEMO_SMOKE_DATABASE_URL;
  if (!databaseUrl)
    throw new Error("Set DEMO_SMOKE_DATABASE_URL to a disposable migrated database.");
  const baseUrl = process.env.DEMO_SMOKE_APP_URL ?? "http://127.0.0.1:3311";
  const secret = "isolated-demo-challenge-validation-secret";
  const sql = postgres(databaseUrl, { max: 1 });
  const redisUrl = process.env.DEMO_SMOKE_REDIS_URL ?? "redis://127.0.0.1:6379/14";
  const redis = new Redis(redisUrl);
  const suffix = randomUUID();
  const host = `demo-host-${suffix}`;
  const guest = `demo-guest-${suffix}`;
  const roomId = `demo-room-${suffix}`;
  const pin = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;
  let motorRequests = 0;
  const blockedMotor = createServer((_request, response) => {
    motorRequests++;
    response.writeHead(503, { "Content-Type": "application/json" });
    response.end('{"status":"unavailable"}');
  });
  await new Promise<void>((resolve) => blockedMotor.listen(0, "127.0.0.1", resolve));
  const address = blockedMotor.address();
  assert.ok(address && typeof address !== "string");
  const app = spawn(
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
      windowsHide: true,
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        REDIS_URL: redisUrl,
        AUTH_SECRET: secret,
        DEMO_CHALLENGES_ENABLED: "true",
        NEWS_PREDICTION_SERVICE_URL: `http://127.0.0.1:${address.port}`,
        NEWS_INSIGHTS_SERVICE_URL: `http://127.0.0.1:${address.port}`,
      },
    },
  );
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    const deadline = Date.now() + 45_000;
    while (true) {
      try {
        if ((await fetch(`${baseUrl}/api/health`)).ok) break;
      } catch {
        /* startup */
      }
      if (Date.now() > deadline || app.exitCode !== null) throw new Error("App startup failed");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    await sql`insert into users (id,name,email,password_hash) values
      (${host},'Anfitrião teste',${`${host}@test.invalid`},'not-a-password'),
      (${guest},'Participante teste',${`${guest}@test.invalid`},'not-a-password')`;
    await sql`insert into rooms (id,pin,name,status,round_duration_seconds,current_round,total_rounds,host_id)
      values (${roomId},${pin},'Desafio de apresentação','waiting',600,0,0,${host})`;
    await sql`insert into room_members (id,room_id,user_id,role) values
      (${randomUUID()},${roomId},${host},'host'),(${randomUUID()},${roomId},${guest},'participant')`;
    const token = (id: string) =>
      new SignJWT({ id, name: id, email: `${id}@test.invalid` })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(id)
        .setIssuedAt()
        .setExpirationTime("20m")
        .sign(new TextEncoder().encode(secret));
    const hostToken = await token(host);
    browser = await chromium.launch({ headless: true });
    const hostContext = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    for (const [context, authToken] of [
      [hostContext, hostToken],
      [guestContext, await token(guest)],
    ] as const)
      await context.addCookies([
        { name: "auth_token", value: authToken, url: baseUrl, httpOnly: true, sameSite: "Lax" },
      ]);
    const page = await hostContext.newPage();
    const guestPage = await guestContext.newPage();
    const roomUrl = `${baseUrl}/sala/${encodeURIComponent(pin)}`;
    await Promise.all([page.goto(`${roomUrl}?p=3`), guestPage.goto(`${roomUrl}?p=3`)]);
    assert.equal(await guestPage.getByRole("button", { name: "Carregar as três" }).count(), 0);
    // Stable UI labels are checked below; the server action populates real persisted articles.
    await page.getByText("Preparação da sala", { exact: true }).click();
    await page.getByRole("button", { name: /Carregar as três/i }).click();
    await page
      .getByText(/3 notícias/)
      .first()
      .waitFor();
    await page.reload();
    await page
      .getByText(/3 notícias/)
      .first()
      .waitFor();
    await page.getByRole("button", { name: "Iniciar partida", exact: true }).click();
    const expected = ["reliable", "unreliable", "reliable"];
    const names = ["Verdadeira", "Falsa", "Verdadeira"];
    const request = (round: number, route: string) =>
      fetch(`${baseUrl}/api/${route}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `auth_token=${hostToken}` },
        body: JSON.stringify({ roomId, round }),
      });
    await mkdir("validation/demo-challenges", { recursive: true });
    const results: unknown[] = [];
    for (let round = 1; round <= 3; round++) {
      console.log(`Checking prepared round ${round}`);
      await Promise.all([
        page.getByRole("button", { name: "Classificar notícia como Incerta" }).waitFor(),
        guestPage.getByRole("button", { name: "Classificar notícia como Incerta" }).waitFor(),
      ]);
      assert.equal((await request(round, "news-prediction")).status, 409);
      const insights = await request(round, "news-insights");
      assert.equal(insights.status, 200);
      const insightsData = await insights.json();
      assert.ok(insightsData.analysis);
      await page.getByRole("heading", { name: insightsData.article.title, exact: true }).waitFor();
      assert.equal(insightsData.demonstration, undefined);
      assert.equal(insightsData.modelAnalysis, undefined);
      if (round === 2) {
        await page.screenshot({
          path: "validation/demo-challenges/fiction-before-image-check.png",
          fullPage: true,
        });
        console.log(
          `Fiction image response: ${(await fetch(`${baseUrl}/demo/challenge-street.png`)).status}`,
        );
        const image = await page
          .getByRole("img", { name: insightsData.article.title, exact: true })
          .evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0);
        assert.equal(image, true);
        await page.screenshot({
          path: "validation/demo-challenges/fiction-desktop.png",
          fullPage: true,
        });
        await guestPage.screenshot({
          path: "validation/demo-challenges/fiction-mobile.png",
          fullPage: true,
        });
      }
      await page
        .getByRole("button", { name: `Classificar notícia como ${names[round - 1]}` })
        .click();
      assert.equal((await request(round, "news-prediction")).status, 409);
      await guestPage.getByRole("button", { name: "Classificar notícia como Incerta" }).click();
      await page.getByText("Análise do modelo", { exact: true }).waitFor();
      const response = await request(round, "news-prediction");
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.modelAnalysis.classification, expected[round - 1]);
      assert.ok(data.demonstration?.explanation);
      results.push({
        round,
        classification: data.modelAnalysis.classification,
        fakeProbability: data.modelAnalysis.fakeProbability,
      });
      await page.screenshot({
        path: `validation/demo-challenges/round-${round}-result.png`,
        fullPage: true,
      });
      if (!(await page.locator('[data-purpose="round-scoreboard-stage"]').count()))
        await page
          .getByRole("button", { name: /Ir para o Placar da Rodada|Ver placar agora/i })
          .first()
          .click();
      await page.locator('[data-purpose="round-scoreboard-stage"]').waitFor();
      await page
        .getByRole("button", {
          name: round === 3 ? "Ver Classificação Final" : "Avançar para Próxima Rodada",
        })
        .click();
    }
    await page.locator('[data-purpose="match-scoreboard-stage"]').waitFor();
    const [savedRoom] =
      await sql`select status,current_round,total_rounds from rooms where id=${roomId}`;
    assert.ok(savedRoom);
    assert.equal(savedRoom.status, "finished");
    const votes = await sql`select count(*)::int as count from news_votes where room_id=${roomId}`;
    assert.ok(votes[0]);
    assert.equal(votes[0].count, 6);
    const [hostScore] =
      await sql`select score from room_members where room_id=${roomId} and user_id=${host}`;
    assert.ok(hostScore);
    assert.equal(hostScore.score, 300);
    assert.equal(motorRequests, 0, "No inference or health requests should occur during replay");
    await writeFile(
      "validation/demo-challenges/result.json",
      JSON.stringify(
        {
          status: "passed",
          twoPlayers: true,
          rounds: results,
          modelNetworkRequests: motorRequests,
          reload: true,
          mobile: true,
          fictionImage: true,
          preRevealAccess: "blocked",
          matchFinished: true,
        },
        null,
        2,
      ),
    );
    console.log("Demo challenges smoke passed: three rounds, two players, zero model requests.");
  } finally {
    await browser?.close();
    app.kill();
    blockedMotor.closeAllConnections();
    await new Promise<void>((resolve) => blockedMotor.close(() => resolve()));
    await sql`delete from rooms where id=${roomId}`;
    await sql`delete from users where id in (${host},${guest})`;
    const keys = await redis.keys(`room:${roomId}:*`);
    if (keys.length) await redis.del(...keys);
    await redis.quit();
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
