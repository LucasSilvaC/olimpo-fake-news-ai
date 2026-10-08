"use client";

import Image from "next/image";
import { useState } from "react";

import { Card, Gauge, Pill, Rv, SlideTitle, TrafficLight, useCountUp } from "./primitives";
import type { TLight } from "./primitives";
import { styles } from "./styles";

const BODY = "text-[30px] leading-[1.45] text-white/90";

/* 1 ─ Capa */
function Cover(): React.ReactElement {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
      <Rv k="scale">
        <div
          className={`${styles.float} grid size-44 place-items-center rounded-[40px] bg-white p-5 shadow-[0_30px_60px_-15px_rgba(15,40,120,0.6)]`}
        >
          <Image src="/olimpo-logo.svg" alt="Logo do Olimpo" width={150} height={150} priority />
        </div>
      </Rv>
      <Rv d={1}>
        <Pill>Residência em IA · PUC-Campinas × Instituto Eldorado</Pill>
      </Rv>
      <Rv d={2}>
        <h1 className="text-[150px] leading-none font-black tracking-[-5px] text-white">
          Olimpo<span className="text-amber-300">.</span>
        </h1>
      </Rv>
      <Rv d={3}>
        <p className="max-w-[1250px] text-[46px] leading-[1.25] font-semibold text-white">
          A plataforma que <span className="text-amber-300">ensina a duvidar bem</span>: IA
          explicável + gamificação contra a desinformação.
        </p>
      </Rv>
      <Rv d={4}>
        <Pill tone="amber">Pitch · Olimpo Fake News</Pill>
      </Rv>
    </div>
  );
}

/* 2 ─ Contexto/Problema */
function Problem(): React.ReactElement {
  const items = [
    {
      icon: "📣",
      t: "Cliques acima dos fatos",
      d: "Plataformas priorizam engajamento rápido; a fronteira entre jornalismo e desinformação se mistura.",
    },
    {
      icon: "🫧",
      t: "Bolhas de conteúdo",
      d: "Algoritmos nos expõem ao que já pensamos, e a checagem de fontes é desestimulada.",
    },
    {
      icon: "📉",
      t: "Confiança em queda",
      d: "Uma crise de confiança nas notícias afeta decisões de pessoas, marcas e instituições.",
    },
  ];
  return (
    <div>
      <SlideTitle
        eyebrow="Contexto e oportunidade"
        title="A desinformação tem"
        accent="custo real."
      />
      <div className="grid grid-cols-3 gap-8">
        {items.map((it, i) => (
          <Rv key={it.t} d={2 + i} k="scale">
            <Card className="h-full">
              <div className="mb-5 text-[72px]">{it.icon}</div>
              <h3 className="mb-3 text-[34px] leading-tight font-black tracking-tight">{it.t}</h3>
              <p className="text-[25px] leading-[1.45] text-slate-600">{it.d}</p>
            </Card>
          </Rv>
        ))}
      </div>
      <Rv d={6}>
        <div className="mt-8 rounded-[24px] border border-blue-100 bg-blue-50 px-8 py-5 text-[27px] text-slate-800">
          <strong>Oportunidade:</strong> educação midiática para escolas, empresas e comunidades, um
          mercado que precisa de <strong>pensamento crítico</strong>, não de mais um árbitro.
        </div>
      </Rv>
    </div>
  );
}

/* 3 ─ Desafio */
function Challenge(): React.ReactElement {
  const steps = ["Lê a manchete", "Reage por impulso", "Compartilha", "Ninguém checa"];
  return (
    <div>
      <SlideTitle
        eyebrow="O ponto de dor"
        title="Como a população avalia"
        accent="notícias hoje?"
      />
      <div className="grid grid-cols-[1.1fr_1fr] gap-10">
        <div className="space-y-6">
          <Rv d={2} k="left">
            <p className={BODY}>
              Sobrecarga de informação + bolhas ={" "}
              <strong className="text-amber-300">senso crítico enfraquecido</strong>. A checagem
              exige esforço; compartilhar exige um clique.
            </p>
          </Rv>
          <Rv d={3} k="left">
            <p className={BODY}>
              Rótulos de “verdadeiro/falso” impostos de fora não treinam ninguém: o usuário continua
              dependente e desconfiado.
            </p>
          </Rv>
          <Rv d={4} k="left">
            <Pill tone="amber">A pergunta: como devolver o critério ao leitor?</Pill>
          </Rv>
        </div>
        <Card className="flex flex-col justify-center gap-5">
          {steps.map((s, i) => (
            <Rv key={s} d={3 + i} k="right">
              <div className="flex items-center gap-5">
                <span
                  className={`grid size-14 shrink-0 place-items-center rounded-full text-[26px] font-black ${i === 3 ? "bg-red-500 text-white" : "bg-blue-100 text-blue-700"}`}
                >
                  {i + 1}
                </span>
                <span className="text-[32px] font-bold">{s}</span>
              </div>
            </Rv>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* 4 ─ Solução */
function Solution(): React.ReactElement {
  const pillars = [
    { i: "🎓", t: "Ensina", d: "Cada rodada vira uma lição de leitura crítica." },
    { i: "🔍", t: "Explica", d: "Sinais interpretáveis, não caixa-preta." },
    { i: "🤝", t: "Não julga", d: "A IA apoia; a decisão é sempre humana." },
  ];
  return (
    <div>
      <SlideTitle
        eyebrow="Solução proposta"
        title="Uma plataforma educacional que"
        accent="ensina, não julga."
      />
      <Rv d={2}>
        <p className={`${BODY} mb-10 max-w-[1500px]`}>
          O Olimpo combina um modelo de IA treinado em português com uma experiência gamificada: o
          usuário avalia primeiro e só depois vê a análise e os sinais que a sustentam.
        </p>
      </Rv>
      <div className="grid grid-cols-3 gap-8">
        {pillars.map((p, i) => (
          <Rv key={p.t} d={3 + i} k="scale">
            <Card className="text-center">
              <div className="mx-auto mb-4 grid size-28 place-items-center rounded-[28px] bg-blue-50 text-[64px]">
                {p.i}
              </div>
              <h3 className="mb-2 text-[40px] font-black tracking-tight text-blue-700">{p.t}</h3>
              <p className="text-[26px] leading-snug text-slate-600">{p.d}</p>
            </Card>
          </Rv>
        ))}
      </div>
    </div>
  );
}

/* 5 ─ Gamificação */
function Gamification(): React.ReactElement {
  const loop = [
    { n: "1", t: "Você avalia", d: "Decide: confiável ou suspeita?" },
    { n: "2", t: "Compromete-se", d: "Registra a resposta antes de ver a IA." },
    { n: "3", t: "IA revela sinais", d: "Score, semáforo e evidências." },
    { n: "4", t: "Reflete", d: "Pergunta socrática fecha o ciclo." },
  ];
  return (
    <div>
      <SlideTitle
        eyebrow="Diferencial · gamificação"
        title="Modo desafio inspirado no"
        accent="Kahoot."
      />
      <div className="grid grid-cols-4 gap-6">
        {loop.map((s, i) => (
          <Rv key={s.n} d={2 + i} k="up">
            <Card className="relative h-full">
              <span className="absolute -top-6 left-8 grid size-14 place-items-center rounded-2xl bg-amber-400 text-[30px] font-black text-slate-950 shadow-[0_10px_20px_-6px_rgba(251,191,36,0.7)]">
                {s.n}
              </span>
              <h3 className="mt-6 mb-2 text-[34px] leading-tight font-black tracking-tight">
                {s.t}
              </h3>
              <p className="text-[25px] leading-snug text-slate-600">{s.d}</p>
            </Card>
          </Rv>
        ))}
      </div>
      <Rv d={7}>
        <div className="mt-10 flex flex-wrap gap-4">
          <Pill>🏟️ Salas multijogador</Pill>
          <Pill>⏱️ Rodadas cronometradas</Pill>
          <Pill>🏆 Placar e ranking</Pill>
          <Pill tone="amber">Avaliar antes de analisar = engajamento + aprendizado</Pill>
        </div>
      </Rv>
    </div>
  );
}

/* 6 ─ Fluxo 1 */
function Flow1(): React.ReactElement {
  const entries = [
    { i: "🎮", t: "Entrar em uma sala", d: "Jogue partidas com notícias selecionadas." },
    { i: "🔗", t: "Extrair de uma URL", d: "Cole o link; o Olimpo lê título e texto." },
    { i: "✍️", t: "Submeter uma notícia", d: "Contribua com casos e explique os sinais." },
  ];
  return (
    <div>
      <SlideTitle
        eyebrow="Como funciona · 1"
        title="O usuário escolhe ou insere"
        accent="uma notícia."
      />
      <div className="grid grid-cols-[1fr_auto_1.1fr] items-center gap-8">
        <div className="space-y-5">
          {entries.map((e, i) => (
            <Rv key={e.t} d={2 + i} k="left">
              <Card className="flex items-center gap-6 !p-6">
                <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[44px]">
                  {e.i}
                </span>
                <div>
                  <div className="text-[30px] font-black tracking-tight">{e.t}</div>
                  <div className="text-[23px] text-slate-600">{e.d}</div>
                </div>
              </Card>
            </Rv>
          ))}
        </div>
        <Rv d={5} k="scale">
          <div className="text-[90px] font-black text-amber-300">→</div>
        </Rv>
        <Rv d={5} k="right">
          <Card>
            <div className="mb-3 text-[22px] font-bold tracking-widest text-blue-600 uppercase">
              Pré-processamento
            </div>
            <ul className="space-y-3 text-[27px] text-slate-700">
              <li>• Normalização do texto</li>
              <li>• Truncamento em 100 palavras</li>
              <li>• TF-IDF (palavras + caracteres) + metadados</li>
              <li>• Classificação pelo LinearSVC</li>
            </ul>
          </Card>
        </Rv>
      </div>
    </div>
  );
}

/* 7 ─ Fluxo 2 */
function Flow2(): React.ReactElement {
  const score = useCountUp(82, 1600);
  return (
    <div>
      <SlideTitle eyebrow="Como funciona · 2" title="Análise e feedback" accent="interpretáveis." />
      <div className="grid grid-cols-[auto_1fr_1.2fr] items-center gap-10">
        <Rv d={2} k="scale">
          <TrafficLight level="green" size={92} />
        </Rv>
        <Rv d={3} k="up">
          <Card className="text-center">
            <div className="text-[22px] font-bold tracking-widest text-blue-600 uppercase">
              Score de confiabilidade
            </div>
            <div className="my-2 text-[120px] leading-none font-black text-green-600">{score}</div>
            <div className="mx-auto h-5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`${styles.grow} h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500`}
                style={{ width: "82%", "--d": "900ms" } as React.CSSProperties}
              />
            </div>
            <div className="mt-3 text-[20px] text-slate-500">Exemplo ilustrativo</div>
          </Card>
        </Rv>
        <div className="space-y-4">
          {[
            ["🟢", "Estrutura jornalística: fonte e data presentes"],
            ["🟡", "Tom opinativo em um parágrafo"],
            ["🔴", "Apelo emocional em uma manchete"],
          ].map(([ic, tx], i) => (
            <Rv key={tx} d={4 + i} k="right">
              <div className="flex items-center gap-4 rounded-[24px] bg-white/15 px-6 py-5 text-[27px] font-semibold ring-1 ring-white/30 backdrop-blur">
                <span className="text-[36px]">{ic}</span>
                {tx}
              </div>
            </Rv>
          ))}
          <Rv d={7}>
            <Pill tone="amber">Depois: reflexão guiada</Pill>
          </Rv>
        </div>
      </div>
    </div>
  );
}

/* 8 ─ Tecnologia */
function Tech(): React.ReactElement {
  const bars = [
    { l: "LogReg · word", v: 0.9243, c: "bg-slate-300" },
    { l: "LogReg · melhor", v: 0.9474, c: "bg-blue-300" },
    { l: "LinearSVC", v: 0.9554, c: "bg-amber-400" },
  ];
  const f1 = useCountUp(0.9554, 1500, 4);
  return (
    <div>
      <SlideTitle
        eyebrow="Tecnologia · modelo supervisionado"
        title="LinearSVC + TF-IDF:"
        accent="robusto e medido."
      />
      <div className="grid grid-cols-[1fr_1.15fr_0.9fr] gap-8">
        <Rv d={2} k="left">
          <Card className="h-full">
            <h3 className="mb-4 text-[28px] font-black">Fake.br-Corpus</h3>
            <div
              className="mx-auto mb-5 grid size-60 place-items-center rounded-full"
              style={{ background: "conic-gradient(#3478ed 0 50%, #fbbf24 50% 100%)" }}
            >
              <div className="grid size-36 place-items-center rounded-full bg-white text-center">
                <div>
                  <div className="text-[40px] leading-none font-black">7.200</div>
                  <div className="text-[18px] text-slate-500">notícias</div>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-[24px]">
              <div className="flex items-center gap-3">
                <span className="size-5 rounded-full bg-blue-600" />
                3.600 verdadeiras
              </div>
              <div className="flex items-center gap-3">
                <span className="size-5 rounded-full bg-amber-400" />
                3.600 falsas
              </div>
            </div>
          </Card>
        </Rv>
        <Rv d={3} k="up">
          <Card className="h-full">
            <h3 className="mb-2 text-[28px] font-black">F1-Macro vs. baseline</h3>
            <div className="mb-5 text-[64px] leading-none font-black text-blue-600">{f1}</div>
            <div className="space-y-5">
              {bars.map((b, i) => (
                <div key={b.l}>
                  <div className="mb-1 flex justify-between text-[22px] font-semibold">
                    <span>{b.l}</span>
                    <span>{b.v.toFixed(4).replace(".", ",")}</span>
                  </div>
                  <div className="h-8 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`${styles.grow} h-full rounded-full ${b.c}`}
                      style={
                        {
                          width: `${((b.v - 0.9) / 0.06) * 100}%`,
                          "--d": `${700 + i * 250}ms`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[19px] text-slate-500">
              Baseline: Regressão Logística, 0,9243 a 0,9474. Eixo iniciado em 0,90.
            </p>
          </Card>
        </Rv>
        <Rv d={4} k="right">
          <Card className="h-full">
            <h3 className="mb-3 text-[28px] font-black">Matriz de confusão</h3>
            <div className="mb-2 text-[18px] text-slate-500">Teste: 1.440 textos (720/720)</div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-green-100 p-4">
                <div className="text-[40px] font-black text-green-700">671</div>
                <div className="text-[16px]">falsas acertadas</div>
              </div>
              <div className="rounded-2xl bg-red-100 p-4">
                <div className="text-[40px] font-black text-red-600">49</div>
                <div className="text-[16px]">falsa → verdadeira</div>
              </div>
              <div className="rounded-2xl bg-red-100 p-4">
                <div className="text-[40px] font-black text-red-600">15</div>
                <div className="text-[16px]">verdadeira → falsa</div>
              </div>
              <div className="rounded-2xl bg-green-100 p-4">
                <div className="text-[40px] font-black text-green-700">705</div>
                <div className="text-[16px]">verdadeiras acertadas</div>
              </div>
            </div>
            <div className="mt-4 text-[26px] font-black text-blue-700">64 erros / 1.440</div>
            <div className="text-[16px] text-slate-500">
              Distribuição por classe derivada do total de 64 erros (49 + 15) e do corpus
              balanceado.
            </div>
          </Card>
        </Rv>
      </div>
    </div>
  );
}

/* 9 ─ SHAP */
function Explain(): React.ReactElement {
  const signals = [
    { l: "Apelo emocional / caixa alta", v: 88, c: "bg-red-500" },
    { l: "Linguagem sensacionalista", v: 72, c: "bg-red-400" },
    { l: "Estrutura jornalística", v: 64, c: "bg-green-500" },
    { l: "Citação de fonte", v: 51, c: "bg-green-400" },
  ];
  return (
    <div>
      <SlideTitle
        eyebrow="Explicabilidade com SHAP"
        title="O modelo não é árbitro:"
        accent="é um guia."
      />
      <div className="grid grid-cols-[1.2fr_1fr] gap-10">
        <Rv d={2} k="left">
          <Card>
            <h3 className="mb-1 text-[30px] font-black">Contribuição dos sinais (ilustrativo)</h3>
            <p className="mb-5 text-[20px] text-slate-500">
              Valores SHAP indicam quanto cada atributo empurra a predição para falsa (vermelho) ou
              confiável (verde).
            </p>
            <div className="space-y-5">
              {signals.map((s, i) => (
                <div key={s.l}>
                  <div className="mb-1 text-[23px] font-semibold">{s.l}</div>
                  <div className="h-7 rounded-full bg-slate-100">
                    <div
                      className={`${styles.grow} h-full rounded-full ${s.c}`}
                      style={
                        { width: `${s.v}%`, "--d": `${600 + i * 200}ms` } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Rv>
        <div className="space-y-5">
          <Rv d={3} k="right">
            <Card className="!p-6">
              <strong className="text-blue-600">Rastreável:</strong>{" "}
              <span className="text-[25px]">
                cada predição aponta os atributos que a sustentam.
              </span>
            </Card>
          </Rv>
          <Rv d={4} k="right">
            <Card className="!p-6">
              <strong className="text-blue-600">Menor risco:</strong>{" "}
              <span className="text-[25px]">
                transparência apoia governança de IA centrada no humano.
              </span>
            </Card>
          </Rv>
          <Rv d={5} k="right">
            <div className="rounded-[24px] border border-amber-300 bg-amber-50 p-6 text-[24px] text-slate-800">
              <strong>Limites assumidos:</strong> o modelo reflete o Fake.br-Corpus; não generaliza
              automaticamente para notícias externas e{" "}
              <strong>não comprova veracidade factual</strong>.
            </div>
          </Rv>
        </div>
      </div>
    </div>
  );
}

/* 10 ─ Tela 1 */
function Screen1(): React.ReactElement {
  const [answer, setAnswer] = useState<"real" | "fake" | null>(null);
  return (
    <div>
      <SlideTitle eyebrow="A solução · tela 1" title="Modo desafio:" accent="avalie primeiro." />
      <div className="grid grid-cols-[1.4fr_1fr] gap-10">
        <Rv d={2} k="scale">
          <Card className="overflow-hidden !p-0">
            <div className="flex items-center gap-2 bg-slate-100 px-6 py-3">
              <span className="size-4 rounded-full bg-red-400" />
              <span className="size-4 rounded-full bg-amber-400" />
              <span className="size-4 rounded-full bg-green-400" />
              <span className="ml-4 rounded-full bg-white px-4 py-1 text-[16px] text-slate-500">
                olimpo · sala · rodada 3/10
              </span>
              <span className="ml-auto rounded-full bg-amber-400 px-4 py-1 text-[18px] font-black text-slate-950">
                ⏱ 00:24
              </span>
            </div>
            <div className="space-y-5 p-8">
              <div className="text-[18px] font-bold tracking-widest text-blue-600 uppercase">
                Notícia da rodada (exemplo)
              </div>
              <h3 className="text-[34px] leading-tight font-black tracking-tight">
                “Cientistas confirmam que chá caseiro elimina qualquer vírus em 24 horas”
              </h3>
              <p className="text-[22px] text-slate-600">
                Publicado em um site sem autoria. O texto não cita estudos nem instituições…
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(["real", "fake"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setAnswer(k)}
                    className={`${styles.cta} rounded-[16px] px-6 py-5 text-[28px] font-extrabold ${answer === k ? "bg-amber-300 ring-4 ring-blue-700/50" : "bg-amber-400 hover:bg-amber-300"} text-slate-950`}
                  >
                    {k === "real" ? "✅ Confiável" : "🚩 Suspeita"}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </Rv>
        <div className="space-y-5">
          <Rv d={3} k="right">
            <div className="rounded-[28px] bg-white/15 p-6 ring-1 ring-white/30 backdrop-blur">
              <div className="mb-2 text-[20px] font-bold text-amber-300">Pergunta socrática</div>
              <p className="text-[28px] leading-snug font-semibold">
                Quem assina esta afirmação, e que evidência ela apresenta?
              </p>
            </div>
          </Rv>
          <Rv d={4} k="right">
            <div className="rounded-[28px] bg-white p-6 text-slate-800 shadow-lg">
              {answer ? (
                <p className="text-[25px]">
                  <strong className="text-blue-600">Resposta registrada.</strong> Na próxima tela,
                  compare com a análise da IA.
                </p>
              ) : (
                <p className="text-[25px] text-slate-500">
                  👆 Clique em uma resposta: o ciclo começa pelo seu julgamento.
                </p>
              )}
            </div>
          </Rv>
        </div>
      </div>
    </div>
  );
}

/* 11 ─ Tela 2 */
const EXAMPLES: {
  key: string;
  label: string;
  score: number;
  level: TLight;
  signals: string[];
  reflect: string;
}[] = [
  {
    key: "f",
    label: "Suspeita",
    score: 18,
    level: "red",
    signals: [
      "Apelo emocional e caixa alta",
      "Sem fonte ou autoria",
      "Promessa absoluta (“elimina qualquer vírus”)",
    ],
    reflect: "Que fonte você exigiria para acreditar nessa promessa?",
  },
  {
    key: "m",
    label: "Duvidosa",
    score: 52,
    level: "yellow",
    signals: ["Tom opinativo", "Fonte citada, sem link", "Estrutura jornalística parcial"],
    reflect: "O que você checaria antes de compartilhar?",
  },
  {
    key: "t",
    label: "Confiável",
    score: 86,
    level: "green",
    signals: ["Autoria e data presentes", "Citação de fontes", "Linguagem neutra"],
    reflect: "O que tornou este texto mais fácil de verificar?",
  },
];

function Screen2(): React.ReactElement {
  const [i, setI] = useState(0);
  const ex = EXAMPLES[i] ?? EXAMPLES[0]!;
  const text = { red: "text-red-600", yellow: "text-amber-500", green: "text-green-600" }[ex.level];
  return (
    <div>
      <SlideTitle
        eyebrow="A solução · tela 2"
        title="Análise com score,"
        accent="semáforo e sinais."
      />
      <Rv d={1}>
        <div className="mb-5 flex gap-3">
          {EXAMPLES.map((e, k) => (
            <button
              key={e.key}
              onClick={() => setI(k)}
              className={`rounded-full px-6 py-2 text-[22px] font-bold transition ${k === i ? "bg-amber-400 text-slate-950 shadow-[0_8px_18px_-6px_rgba(251,191,36,0.8)]" : "bg-white/20 text-white ring-1 ring-white/30 hover:bg-white/30"}`}
            >
              Exemplo: {e.label}
            </button>
          ))}
        </div>
      </Rv>
      <div key={ex.key} className="grid grid-cols-[auto_1fr_1.2fr] items-center gap-8">
        <Rv d={1} k="scale">
          <TrafficLight level={ex.level} size={80} />
        </Rv>
        <Rv d={2}>
          <Card className="text-center">
            <Gauge score={ex.score} />
            <div className={`-mt-2 text-[80px] leading-none font-black ${text}`}>
              {ex.score}
              <span className="text-[32px] text-slate-400">/100</span>
            </div>
          </Card>
        </Rv>
        <div className="space-y-4">
          <Rv d={3} k="right">
            <Card className="!p-6">
              <div className="mb-2 text-[20px] font-bold tracking-widest text-blue-600 uppercase">
                Sinais de estilo e estrutura
              </div>
              <ul className="space-y-1 text-[25px]">
                {ex.signals.map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>
            </Card>
          </Rv>
          <Rv d={4} k="right">
            <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-6 text-[24px] text-slate-800">
              <strong>Reflexão guiada:</strong> {ex.reflect}
            </div>
          </Rv>
        </div>
      </div>
    </div>
  );
}

/* 12 ─ Impacto */
function Impact(): React.ReactElement {
  const items = [
    ["🧠", "Pensamento crítico", "Hábito de checar antes de compartilhar."],
    ["🛡️", "Confiança informada", "Decisão apoiada em sinais, não em rótulos."],
    ["🫧", "Menos bolhas", "Contato com casos e perspectivas diversas."],
    ["⚖️", "Educação em IA ética", "Usuário entende o que a IA faz e não faz."],
    ["🧑‍⚖️", "Governança centrada no humano", "Transparência e adaptabilidade (AIPGF)."],
    ["📈", "Escala educacional", "Salas e partidas para escolas e equipes."],
  ];
  return (
    <div>
      <SlideTitle eyebrow="Impacto esperado" title="Valor educacional," accent="com governança." />
      <div className="grid grid-cols-3 gap-6">
        {items.map(([ic, t, d], i) => (
          <Rv key={t} d={2 + i} k="scale">
            <Card className="h-full !p-7">
              <div className="mb-3 text-[56px]">{ic}</div>
              <h3 className="mb-1 text-[30px] leading-tight font-black tracking-tight text-blue-700">
                {t}
              </h3>
              <p className="text-[23px] text-slate-600">{d}</p>
            </Card>
          </Rv>
        ))}
      </div>
    </div>
  );
}

/* 13 ─ Validação */
function Validation(): React.ReactElement {
  const done = [
    "Classificação supervisionada (LinearSVC) e baseline LogReg",
    "Aprendizado não supervisionado experimentado",
    "Limpeza de dados e avaliação por F1, precisão, recall e matriz de confusão",
    "Modelo em Python; 3+ visualizações; SHAP",
    "Protótipo funcional (web-app) com aspectos éticos",
  ];
  const plan = [
    "Testes com usuários reais (salas piloto)",
    "Mudança de decisão após ver os sinais da IA",
    "Taxa de acerto antes/depois e erros por tema",
    "Feedback qualitativo e usabilidade",
  ];
  return (
    <div>
      <SlideTitle
        eyebrow="Validação e evidências"
        title="O que já provamos e o que"
        accent="vamos medir."
      />
      <div className="grid grid-cols-2 gap-8">
        <Rv d={2} k="left">
          <Card className="h-full">
            <Pill tone="white">✅ Evidência técnica obtida</Pill>
            <ul className="mt-5 space-y-3 text-[24px]">
              {done.map((d) => (
                <li key={d}>✔ {d}</li>
              ))}
            </ul>
            <p className="mt-4 text-[20px] text-slate-500">
              Teste: F1-Macro 0,9554; 64 erros em 1.440 textos.
            </p>
          </Card>
        </Rv>
        <Rv d={3} k="right">
          <Card className="h-full border-4 border-dashed border-amber-300">
            <Pill tone="amber">🧪 Planejado · validação com usuários</Pill>
            <ul className="mt-5 space-y-3 text-[24px]">
              {plan.map((d) => (
                <li key={d}>◻ {d}</li>
              ))}
            </ul>
            <p className="mt-4 text-[20px] text-slate-500">
              Ainda sem métricas de usuários: serão apresentadas após a coleta.
            </p>
          </Card>
        </Rv>
      </div>
    </div>
  );
}

/* 14 ─ Roadmap */
function Roadmap(): React.ReactElement {
  const phases = [
    {
      t: "Entregue",
      c: "bg-green-500",
      items: [
        "Modelo LinearSVC treinado",
        "Web-app com sala, jogo e ranking",
        "Extração de notícias por URL",
      ],
    },
    {
      t: "Próximo",
      c: "bg-amber-400",
      items: [
        "Validação com usuários reais",
        "Pitch e proposta de negócio",
        "Refino de UX e acessibilidade",
      ],
    },
    {
      t: "Depois",
      c: "bg-blue-300",
      items: [
        "Mais salas e partidas simultâneas",
        "Generalização para notícias externas",
        "Análises agregadas por perfil e tema",
      ],
    },
  ];
  return (
    <div>
      <SlideTitle
        eyebrow="Roadmap e próximos passos"
        title="De MVP a"
        accent="plataforma escalável."
      />
      <div className="relative">
        <div
          className={`${styles.grow} absolute top-[22px] right-10 left-10 h-3 rounded-full bg-white/40`}
          style={{ "--d": "300ms" } as React.CSSProperties}
        />
        <div className="relative grid grid-cols-3 gap-8">
          {phases.map((p, i) => (
            <Rv key={p.t} d={2 + i * 2} k="up">
              <span
                className={`mb-6 grid size-12 place-items-center rounded-full ${p.c} text-[24px] font-black text-slate-950 ring-8 ring-white/30`}
              >
                {i + 1}
              </span>
              <Card className="!p-7">
                <h3 className="mb-3 text-[34px] font-black tracking-tight">{p.t}</h3>
                <ul className="space-y-2 text-[24px] text-slate-700">
                  {p.items.map((it) => (
                    <li key={it}>• {it}</li>
                  ))}
                </ul>
              </Card>
            </Rv>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 15 ─ Encerramento */
function Closing(): React.ReactElement {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
      <Rv k="scale">
        <Pill>Resumo</Pill>
      </Rv>
      <Rv d={1}>
        <h2 className="max-w-[1500px] text-[96px] leading-[1.05] font-black tracking-[-3px]">
          Ensinar a <span className="text-amber-300">pensar</span> vale mais que dizer o que pensar.
        </h2>
      </Rv>
      <Rv d={2}>
        <p className="max-w-[1300px] text-[34px] leading-snug text-white/90">
          IA explicável, gamificação e governança centrada no humano. Queremos pilotos com escolas,
          empresas e comunidades.
        </p>
      </Rv>
      <Rv d={3}>
        <a
          href="/login"
          className={`${styles.cta} ${styles.pulse} inline-flex items-center gap-3 rounded-[16px] bg-amber-400 px-12 py-6 text-[36px] font-extrabold text-slate-950 no-underline hover:bg-amber-300`}
        >
          Vamos pilotar o Olimpo <span aria-hidden="true">→</span>
        </a>
      </Rv>
      <Rv d={4}>
        <div className="flex items-center gap-8">
          <Image
            src="/partners/puc-campinas.svg"
            alt="PUC-Campinas"
            width={206}
            height={78}
            className="brightness-0 invert"
          />
          <Image
            src="/partners/eldorado.svg"
            alt="Instituto Eldorado"
            width={212}
            height={87}
            className="brightness-0 invert"
          />
        </div>
      </Rv>
    </div>
  );
}

export const SLIDES: { title: string; Component: () => React.ReactElement }[] = [
  { title: "Capa", Component: Cover },
  { title: "Contexto e problema", Component: Problem },
  { title: "Desafio", Component: Challenge },
  { title: "Solução", Component: Solution },
  { title: "Gamificação", Component: Gamification },
  { title: "Fluxo 1", Component: Flow1 },
  { title: "Fluxo 2", Component: Flow2 },
  { title: "Tecnologia", Component: Tech },
  { title: "Explicabilidade", Component: Explain },
  { title: "Tela 1", Component: Screen1 },
  { title: "Tela 2", Component: Screen2 },
  { title: "Impacto", Component: Impact },
  { title: "Validação", Component: Validation },
  { title: "Roadmap", Component: Roadmap },
  { title: "Encerramento", Component: Closing },
];
