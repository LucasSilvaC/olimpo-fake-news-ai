import crypto from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { extractNews } from "../src/lib/news/extract-news";
import type { INewsArticle } from "../src/lib/news/types";
import { httpAIAnalysisService } from "../src/app/api/ai-feedback/repositories/http-ai-analysis.service";
import type { AIAnalysisResult } from "../src/app/api/ai-feedback/repositories/ai-analysis-service.interface";
import {
  globalChallenges,
  newsAnalyses,
  newsArticles,
  type MLTargetType,
} from "../src/server/shared/database/schemas";

export interface SeedChallengeDefinition {
  url: string;
  title: string;
  category: string;
  targetClassification: MLTargetType;
  fallbackDescription: string;
  fallbackContent: string;
}

export const SEED_CHALLENGES: SeedChallengeDefinition[] = [
  // 1. Planeta Bizarro (reliable)
  {
    url: "https://g1.globo.com/planeta-bizarro/noticia/2019/09/04/gato-e-preso-suspeito-de-furto-nos-eua.ghtml",
    title: "Gato é 'preso' suspeito de furto nos EUA",
    category: "Planeta Bizarro",
    targetClassification: "reliable",
    fallbackDescription:
      "Família chamou polícia da Flórida por suspeitar de tentativa de roubo, mas era apenas um felino perdido.",
    fallbackContent:
      "Família chamou polícia da Flórida por suspeitar de tentativa de roubo, mas era apenas um felino perdido. Policiais foram atender a um chamado por furto no estado americano da Flórida e acabaram prendendo um suspeito improvável: um gato. O caso aconteceu no condado de Collier. Uma moradora ligou para a polícia após ouvir barulhos estranhos e suspeitar de invasão domiciliar, mas os agentes encontraram o felino escondido sob uma pilha de caixas.",
  },
  // 2. Pernambuco / Incêndio UFPE (unreliable)
  {
    url: "https://g1.globo.com/pe/pernambuco/noticia/2026/10/07/incendio-predio-da-ufpe-video.ghtml?utm_source=chatgpt.com",
    title: "Incêndio de grandes proporções atinge prédio da UFPE no Recife; VÍDEO",
    category: "Pernambuco",
    targetClassification: "unreliable",
    fallbackDescription:
      "Corpo de Bombeiros enviou cinco viaturas. Não houve feridos. Este é o terceiro caso registrado na instituição em uma semana.",
    fallbackContent:
      "Segundo testemunhas, o fogo começou por volta das 19h30. Imagens enviadas ao g1 e à TV Globo mostram as chamas se espalhando no local. No fim da noite, o Corpo de Bombeiros informou que as chamas foram controladas e ninguém ficou ferido. O incêndio atingiu o prédio do Centro de Biociências da Universidade Federal de Pernambuco, mobilizando equipes de emergência durante a noite.",
  },
  // 3. Fato ou Fake / Clint Eastwood IA (uncertain)
  {
    url: "https://g1.globo.com/fato-ou-fake/noticia/2026/09/04/e-fake-foto-de-aniversario-de-clint-eastwood-com-atores-renomados.ghtml?utm_source=chatgpt.com",
    title: "Foto de aniversário de Clint Eastwood com atores foi criada com IA",
    category: "Fato ou Fake",
    targetClassification: "uncertain",
    fallbackDescription:
      "Detector da OpenAI, dona do ChatGPT, aponta que conteúdo foi criado com ferramentas de IA da empresa.",
    fallbackContent:
      "Detector da OpenAI, dona do ChatGPT, aponta que conteúdo foi criado com ferramentas de IA da empresa. É #FAKE foto de aniversário de Clint Eastwood com atores renomados. Circula nas redes sociais uma imagem que supostamente mostraria a celebração do aniversário do ator Clint Eastwood ao lado de outras lendas de Hollywood. No entanto, análises técnicas confirmaram que a imagem foi sintetizada por sistemas de inteligência artificial generativa.",
  },
];

export function getFallbackModelAnalysis(item: SeedChallengeDefinition): AIAnalysisResult {
  switch (item.targetClassification) {
    case "reliable":
      return {
        analysisStatus: "ok",
        classification: "reliable",
        fakeProbability: 0.07069678208296748,
        fakeScore: 7.069678208296748,
        scoreKind: "predicted_fake_probability",
        modelVersion: "svm-spacy-chi2k10k-svd500-v1",
        policyVersion: "olimpo-decision-policy-v1",
        artifactSha256: "123763864725531f12aa0503530edce432ca6e59853d36ef472559790207df27",
        inferenceVersion: "1b552c7bd1a07e12e6323c50f1a81e8095f3a6cf326ea01394f4af6a94b6b97b",
        reasons: [
          "Termos associados a notícias verdadeiras no corpus de treino que influenciaram a previsão: 'mas', 'suspeito', 'em'.",
        ],
        inputScope: {
          source: "article_body",
          wordLimit: 100,
          analyzedWordCount: 100,
          truncated: true,
        },
      };
    case "unreliable":
      return {
        analysisStatus: "ok",
        classification: "unreliable",
        fakeProbability: 0.6766751343517216,
        fakeScore: 67.66751343517215,
        scoreKind: "predicted_fake_probability",
        modelVersion: "svm-spacy-chi2k10k-svd500-v1",
        policyVersion: "olimpo-decision-policy-v1",
        artifactSha256: "123763864725531f12aa0503530edce432ca6e59853d36ef472559790207df27",
        inferenceVersion: "1b552c7bd1a07e12e6323c50f1a81e8095f3a6cf326ea01394f4af6a94b6b97b",
        reasons: [
          "Termos associados a notícias falsas no corpus de treino que influenciaram a previsão: 'informou', 'que as', 'local'.",
          "Característica da escrita: frases curtas.",
        ],
        inputScope: {
          source: "article_body",
          wordLimit: 100,
          analyzedWordCount: 100,
          truncated: true,
        },
      };
    case "uncertain":
      return {
        analysisStatus: "ok",
        classification: "uncertain",
        fakeProbability: 0.47874014235105616,
        fakeScore: 47.87401423510562,
        scoreKind: "predicted_fake_probability",
        modelVersion: "svm-spacy-chi2k10k-svd500-v1",
        policyVersion: "olimpo-decision-policy-v1",
        artifactSha256: "123763864725531f12aa0503530edce432ca6e59853d36ef472559790207df27",
        inferenceVersion: "1b552c7bd1a07e12e6323c50f1a81e8095f3a6cf326ea01394f4af6a94b6b97b",
        reasons: [
          "Termos associados a notícias verdadeiras no corpus de treino que influenciaram a previsão: 'como', 'ao', 'bolo'.",
          "Característica da escrita: uso baixo de artigos/determinantes.",
        ],
        inputScope: {
          source: "article_body",
          wordLimit: 100,
          analyzedWordCount: 100,
          truncated: true,
        },
      };
  }
}

export interface PopulateChallengesOptions {
  extractNewsFn?: typeof extractNews;
  challenges?: SeedChallengeDefinition[];
  analyzeNewsFn?: (text: string) => Promise<AIAnalysisResult>;
  clearExisting?: boolean;
}

export async function populateChallenges(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbClient: any,
  options: PopulateChallengesOptions = {},
) {
  const challenges = options.challenges ?? SEED_CHALLENGES;
  const extractFn = options.extractNewsFn ?? extractNews;
  const analyzeFn =
    options.analyzeNewsFn ?? ((text: string) => httpAIAnalysisService.analyze(text));

  if (options.clearExisting) {
    console.log("[Seed] Clearing existing global challenges...");
    await dbClient.delete(globalChallenges);
  }

  // Retrieve existing challenges to guarantee idempotency
  const existingChallenges = await dbClient.select().from(globalChallenges);
  const existingArticles = await dbClient.select().from(newsArticles);

  const existingArticleUrls = new Set(
    existingArticles
      .map((item: { article?: { url?: string } }) => item.article?.url)
      .filter(Boolean),
  );
  const existingChallengeTitles = new Set(
    existingChallenges.map((item: { title: string }) => item.title),
  );

  let insertedCount = 0;
  let skippedCount = 0;

  for (const item of challenges) {
    if (existingChallengeTitles.has(item.title) || existingArticleUrls.has(item.url)) {
      console.log(`[Seed] Challenge already exists: "${item.title}". Skipping.`);
      skippedCount += 1;
      continue;
    }

    let articleData: INewsArticle;

    try {
      console.log(`[Seed] Extracting news for URL: ${item.url}`);
      articleData = await extractFn(item.url);
    } catch (error) {
      console.warn(
        `[Seed] Failed to extract from external URL (${item.url}): ${
          error instanceof Error ? error.message : String(error)
        }. Using fallback sample data.`,
      );
      articleData = {
        url: item.url,
        canonicalUrl: item.url,
        title: item.title,
        description: item.fallbackDescription,
        authors: ["G1", "Redação"],
        publishedAt: new Date().toISOString(),
        modifiedAt: null,
        content: item.fallbackContent,
        imageUrl: "https://s2-g1.glbimg.com/placeholder.jpg",
        publisher: "G1",
        language: "pt-BR",
        extractionMethod: "local",
        usedFallback: true,
      };
    }

    // Perform analysis using the model in /model-engine
    let analysisResult: AIAnalysisResult;
    try {
      console.log(`[Seed] Analyzing news with model-engine for: "${item.title}"`);
      analysisResult = await analyzeFn(articleData.content);
    } catch (error) {
      console.warn(
        `[Seed] Failed to analyze with model-engine (${item.url}): ${
          error instanceof Error ? error.message : String(error)
        }. Using fallback model analysis.`,
      );
      analysisResult = getFallbackModelAnalysis(item);
    }

    const targetClassification: MLTargetType =
      (analysisResult.classification as MLTargetType) ?? item.targetClassification;

    const reasons =
      analysisResult.reasons && analysisResult.reasons.length > 0
        ? analysisResult.reasons
        : getFallbackModelAnalysis(item).reasons;

    let confidence: string;
    if (analysisResult.fakeProbability !== null && analysisResult.fakeProbability !== undefined) {
      const prob =
        targetClassification === "unreliable"
          ? analysisResult.fakeProbability
          : targetClassification === "reliable"
            ? 1 - analysisResult.fakeProbability
            : 0.6;
      confidence = prob.toFixed(2);
    } else {
      confidence =
        targetClassification === "reliable"
          ? "0.93"
          : targetClassification === "unreliable"
            ? "0.68"
            : "0.60";
    }

    const articleId = crypto.randomUUID();
    const challengeId = crypto.randomUUID();

    // 1. Persist news_articles record
    await dbClient.insert(newsArticles).values({
      id: articleId,
      article: articleData,
      targetClassification,
    });

    // 2. Persist global_challenges record
    await dbClient.insert(globalChallenges).values({
      id: challengeId,
      title: item.title,
      articleId,
      xpReward: 50,
      isActive: true,
    });

    // 3. Persist model-engine news_analyses record
    await dbClient.insert(newsAnalyses).values({
      id: crypto.randomUUID(),
      articleId,
      classification: targetClassification,
      reasons,
      confidence,
      modelVersion: analysisResult.modelVersion || "svm-spacy-chi2k10k-svd500-v1",
      analysisStatus: "legacy",
      fakeProbability: analysisResult.fakeProbability,
      fakeScore: analysisResult.fakeScore,
      scoreKind: analysisResult.scoreKind || "predicted_fake_probability",
      policyVersion: analysisResult.policyVersion || "olimpo-decision-policy-v1",
      artifactSha256: analysisResult.artifactSha256,
      inferenceVersion: analysisResult.inferenceVersion,
      inputScope: analysisResult.inputScope,
      createdAt: new Date(),
    });

    insertedCount += 1;
    existingArticleUrls.add(item.url);
    existingChallengeTitles.add(item.title);
    console.log(
      `[Seed] Inserted challenge "${item.title}" [${targetClassification}] (ID: ${challengeId}) with model analysis`,
    );
  }

  return { insertedCount, skippedCount, totalProcessed: challenges.length };
}

async function main() {
  const connectionString =
    process.env.DATABASE_URL || "postgresql://postgres:root@localhost:5432/olimpo";
  console.log(`[Seed] Connecting to database...`);
  const sqlClient = postgres(connectionString, { max: 1 });
  const db = drizzle(sqlClient, {
    schema: {
      globalChallenges,
      newsArticles,
      newsAnalyses,
    },
  });

  try {
    const clearExisting = !process.argv.includes("--keep-existing");
    const result = await populateChallenges(db, { clearExisting });
    console.log(
      `[Seed] Seeding finished successfully. Inserted: ${result.insertedCount}, Skipped: ${result.skippedCount}.`,
    );
  } finally {
    await sqlClient.end();
  }
}

// Execute directly if run via CLI
if (
  process.argv[1]?.endsWith("populate-challenges.ts") ||
  process.argv[1]?.endsWith("populate-challenges.js")
) {
  main().catch((error) => {
    console.error("[Seed] Unhandled error during seed execution:", error);
    process.exit(1);
  });
}
