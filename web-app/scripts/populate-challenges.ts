import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { extractNews } from "../src/lib/news/extract-news";
import type { INewsArticle } from "../src/lib/news/types";
import {
  globalChallenges,
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
  // 1. Tecnologia / Inteligência Artificial (reliable)
  {
    url: "https://g1.globo.com/tecnologia/noticia/2024/01/15/inteligencia-artificial-mercado-de-trabalho-fmi.ghtml",
    title: "IA vai afetar 40% dos empregos no mundo e pode aumentar desigualdade, alerta FMI",
    category: "Tecnologia",
    targetClassification: "reliable",
    fallbackDescription:
      "Relatório do Fundo Monetário Internacional aponta que economias avançadas enfrentarão maiores riscos e benefícios com a inteligência artificial.",
    fallbackContent:
      "A inteligência artificial afetará quase 40% de todos os empregos em todo o mundo, de acordo com uma nova análise do Fundo Monetário Internacional (FMI). A diretora-gerente do FMI, Kristalina Georgieva, alertou que na maioria dos cenários a IA provavelmente piorará a desigualdade geral.",
  },
  // 2. Ciência / Espaço (reliable)
  {
    url: "https://g1.globo.com/ciencia/noticia/2024/01/20/japao-pouso-lua-nave-slim.ghtml",
    title: "Japão se torna o 5º país a pousar na Lua com a sonda espacial SLIM",
    category: "Ciência",
    targetClassification: "reliable",
    fallbackDescription:
      "Agência espacial japonesa JAXA confirmou o pouso com precisão histórica na cratera Shioli.",
    fallbackContent:
      "A agência espacial japonesa (JAXA) confirmou que a nave espacial SLIM pousou com sucesso na superfície lunar, tornando o Japão o quinto país a alcançar tal feito histórico, após EUA, União Soviética, China e Índia.",
  },
  // 3. Saúde / Epidemias (reliable)
  {
    url: "https://g1.globo.com/saude/noticia/2024/02/09/dengue-sintomas-prevencao-vacina.ghtml",
    title: "Dengue: conheça sintomas, métodos de prevenção e o esquema vacinal no SUS",
    category: "Saúde",
    targetClassification: "reliable",
    fallbackDescription:
      "Ministério da Saúde detalha sinais de alarme e orientações de combate ao mosquito Aedes aegypti.",
    fallbackContent:
      "Com a alta de casos de dengue no país, autoridades de saúde reforçam a necessidade de eliminar focos de água parada e procurar atendimento rápido caso sintomas como febre alta, dores no corpo e manchas vermelhas se manifestem.",
  },
  // 4. Economia / Inflação (reliable)
  {
    url: "https://g1.globo.com/economia/noticia/2024/01/11/ipca-inflacao-oficial-do-brasil-em-2023.ghtml",
    title: "Inflação oficial fecha o ano dentro do teto da meta estipulada pelo Banco Central",
    category: "Economia",
    targetClassification: "reliable",
    fallbackDescription:
      "Dados do IBGE mostram desaceleração nos preços de alimentos e energia ao longo do último trimestre.",
    fallbackContent:
      "O Índice Nacional de Preços ao Consumidor Amplo (IPCA) registrou acomodação no encerramento do ano, mantendo o índice inflacionário acumulado estritamente dentro do intervalo de tolerância da meta oficial.",
  },
  // 5. Fato ou Fake / Tecnologia (unreliable)
  {
    url: "https://g1.globo.com/fato-ou-fake/noticia/2024/02/01/e-fake-que-governo-vai-bloquear-whatsapp-e-redes-sociais.ghtml",
    title: "É FAKE que governo federal vai bloquear WhatsApp e redes sociais no país",
    category: "Fato ou Fake",
    targetClassification: "unreliable",
    fallbackDescription:
      "Mensagens falsas que circulam em aplicativos de mensagens distorcem projeto de lei sobre regulação digital.",
    fallbackContent:
      "Circula nas redes sociais um boato afirmando que o governo determinou a suspensão imediata de mensageiros e redes sociais no território nacional. A alegação é totalmente inverídica e carece de embasamento legal ou institucional.",
  },
  // 6. Fato ou Fake / Saúde (unreliable)
  {
    url: "https://g1.globo.com/fato-ou-fake/noticia/2024/01/25/e-fake-que-cha-de-folha-de-mamao-cura-dengue-em-24-horas.ghtml",
    title: "É FAKE que chá de folha de mamão cura a dengue em 24 horas",
    category: "Fato ou Fake",
    targetClassification: "unreliable",
    fallbackDescription:
      "Especialistas e infectologistas alertam que não existe comprovação científica para receitas caseiras milagrosas.",
    fallbackContent:
      "Vídeos enganosos têm promovido o consumo de chás caseiros como solução rápida e infalível contra a dengue. Médicos alertam que a automedicação e o abandono de tratamentos adequados geram graves riscos à vida.",
  },
  // 7. Fato ou Fake / Política (unreliable)
  {
    url: "https://g1.globo.com/fato-ou-fake/noticia/2023/10/30/e-fake-que-pesquisas-eleitorais-foram-manipuladas-por-supercomputador.ghtml",
    title: "É FAKE que pesquisas eleitorais foram manipuladas por algoritmo secreto de satélite",
    category: "Fato ou Fake",
    targetClassification: "unreliable",
    fallbackDescription:
      "Teoria da conspiração sem fundamento espalha prints manipulados sobre apuração de votos.",
    fallbackContent:
      "Publicações enganosas associam algoritmos estrangeiros e conexões de satélite a supostas fraudes em pesquisas eleitorais. Institutos de pesquisa e órgãos de checagem desmentiram categoricamente a alegação infundada.",
  },
  // 8. Economia / Projeções (uncertain)
  {
    url: "https://g1.globo.com/economia/noticia/2024/02/15/dolar-hoje-cotacao-mercado-financeiro-projecoes.ghtml",
    title: "Câmbio e juros: analistas divergem sobre trajetória do dólar no segundo semestre",
    category: "Economia",
    targetClassification: "uncertain",
    fallbackDescription:
      "Incertezas no cenário macroeconômico externo e fiscal doméstico geram previsões discrepantes entre bancos de investimento.",
    fallbackContent:
      "O comportamento da moeda norte-americana divide analistas do mercado financeiro. Enquanto alguns preveem fortalecimento das commodities, outros apontam que a manutenção dos juros pelo Fed pode pressionar mercados emergentes.",
  },
  // 9. Ciência / Clima e Modelagem (uncertain)
  {
    url: "https://g1.globo.com/ciencia-e-saude/noticia/2024/01/18/mudancas-climaticas-recorde-temperatura-aquecimento-global.ghtml",
    title: "El Niño e aquecimento: cientistas avaliam intensidade de eventos climáticos futuros",
    category: "Ciência",
    targetClassification: "uncertain",
    fallbackDescription:
      "Modelos meteorológicos apontam transição iminente para La Niña com variações regionais imprevisíveis.",
    fallbackContent:
      "Pesquisadores atmosféricos debatem a velocidade de transição entre os ciclos de El Niño e La Niña, destacando que as projeções de precipitação para certas bacias hidrográficas permanecem com alto grau de incerteza estatística.",
  },
  // 10. Tecnologia / Comportamento Digital (uncertain)
  {
    url: "https://g1.globo.com/tecnologia/noticia/2024/02/10/impacto-das-redes-sociais-na-saude-mental-de-jovens-estudos.ghtml",
    title:
      "Algoritmos e bem-estar: estudos apresentam conclusões mistas sobre impacto do tempo de tela",
    category: "Tecnologia",
    targetClassification: "uncertain",
    fallbackDescription:
      "Novas pesquisas longitudinais sugerem que o tipo de conteúdo consumido é mais determinante que a simples contagem de horas.",
    fallbackContent:
      "O debate científico sobre o impacto das mídias digitais em adolescentes continua em evolução. Pesquisadores ressaltam que dados observacionais ainda não estabelecem causalidade definitiva e requerem estudos controlados mais abrangentes.",
  },
];

export interface PopulateChallengesOptions {
  extractNewsFn?: typeof extractNews;
  challenges?: SeedChallengeDefinition[];
}

export async function populateChallenges(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbClient: any,
  options: PopulateChallengesOptions = {},
) {
  const challenges = options.challenges ?? SEED_CHALLENGES;
  const extractFn = options.extractNewsFn ?? extractNews;

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

    const articleId = crypto.randomUUID();
    const challengeId = crypto.randomUUID();

    // 1. Persist news_articles record
    await dbClient.insert(newsArticles).values({
      id: articleId,
      article: articleData,
      targetClassification: item.targetClassification,
    });

    // 2. Persist global_challenges record
    await dbClient.insert(globalChallenges).values({
      id: challengeId,
      title: item.title,
      articleId,
      xpReward: 50,
      isActive: true,
    });

    insertedCount += 1;
    existingArticleUrls.add(item.url);
    existingChallengeTitles.add(item.title);
    console.log(
      `[Seed] Inserted challenge "${item.title}" [${item.targetClassification}] (ID: ${challengeId})`,
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
    },
  });

  try {
    const result = await populateChallenges(db);
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
