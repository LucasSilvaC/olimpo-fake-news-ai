# Olimpo — Fake News AI (Kahoot de Combate à Desinformação)

> **Status do Projeto**: Em desenvolvimento ativo.  
> **Fase Atual**: Motor de Ingestão e Extração de Notícias implementado e validado + Base arquitetural Next.js 16 com Clean Architecture.  
> **Próxima Fase**: Implementação da interface do jogo (modos multiplayer e solo) com salas, dinâmica de perguntas e ranking.

---

## 📌 1. Visão Geral do Projeto: O que é o Olimpo?

O **Olimpo** (também referenciado como _Fake-or-Fact_ / _Kahoot de Fake News_) é uma plataforma gamificada, educativa e colaborativa desenhada para conscientizar e treinar cidadãos, estudantes e equipes no reconhecimento de notícias falsas (_fake news_) e na identificação de fatos jornalísticos verídicos.

Inspirado na dinâmica competitiva do Kahoot, o Olimpo coloca jogadores em salas multiplayer ou solo onde todos enfrentam rodadas cronometradas com manchetes reais e desafiadoras.

### 🎮 Dinâmica e Mecânicas de Jogo

- **Salas Multiplayer e Solo**: Os participantes podem jogar individualmente ou ingressar em partidas coletivas através de código PIN ou link de convite.
- **Rodadas sob Pressão com Tempo Limite**: A cada rodada, o participante analisa a manchete, fonte sugerida, recorte de texto e imagem antes do cronômetro zerar, decidindo entre:
  - ✖ **É FAKE NEWS** (Boato / Desinformação)
  - ✔ **É FATO REAL** (Notícia Verídica / Jornalismo Investigativo)
  - ❓ **TENHO DÚVIDA** (Necessidade de checagem mais aprofundada)
- **Mecânica de Blefe Colaborativo (User-Generated Challenges)**: Além das notícias de curadoria do sistema, os participantes podem submeter seus próprios desafios autorais. Caso o autor cadastre uma notícia falsa convincente e outros jogadores votem como fato verídico, o autor recebe pontuação bônus de blefe por cada participante induzido ao erro.
- **Feedback Educativo Instantâneo**: Ao encerramento de cada rodada, o sistema revela o gabarito real, exibe a distribuição percentual dos votos da sala e apresenta uma justificativa pedagógica com critérios de fact-checking jornalístico.
- **Ranking Gamificado e Conquistas**: Pódio visual com pontuação acumulada (combinando acertos, rapidez nas respostas e blefes bem-sucedidos) e conquistas/badges temáticas desbloqueáveis ao longo da partida.

---

## 🎨 2. Arquitetura de Telas da Aplicação

A experiência da aplicação é estruturada em 5 telas centrais:

| Tela  | Nome                                     | Funcionalidade Principal                                                                                                                                                                                                                    |
| :---- | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | **Início / Lobby da Sala**               | Entrada por PIN/link, listagem em tempo real de participantes conectados, avatar, contagem de rodadas do baralho e controle do líder para iniciar a partida.                                                                                |
| **2** | **Gameplay / HUD de Notícia**            | Cronômetro animado, identificação da autoria do desafio (amigo vs. sistema), card da matéria (manchete, fonte simulada, resumo), botões táteis de votação (Fato / Fake / Dúvida) e card revelador com gráfico de votação e análise crítica. |
| **3** | **Ranking Gamificado**                   | Pódio dos melhores colocados, tabela com pontuação detalhada (acertos + blefes bem-sucedidos) e conquistas/badges da partida.                                                                                                               |
| **4** | **Tutorial e Regras**                    | Onboarding rápido explicando o funcionamento do jogo, as mecânicas de blefe e um checklist prático de fact-checking jornalístico.                                                                                                           |
| **5** | **Criador de Desafios (Enviar Notícia)** | Formulário onde os jogadores submetem manchete, veículo, trecho do texto, selecionam o gabarito secreto (Fato ou Fake) e escrevem a explicação para a revelação pós-rodada.                                                                 |

---

## ⚙️ 3. O Papel do News Parser no Ecossistema Olimpo

Para que o jogo funcione sem exigir que moderadores humanos criem manualmente todo o banco de dados de notícias, o sistema conta com um **módulo de ingestão e parsing determinístico** (`src/lib/news`).

O **News Parser** recebe qualquer URL de notícia pública na web (G1, Folha, BBC, NASA, portais regionais, etc.) e a converte em um registro padronizado e seguro de notícia.

### 🛡️ Princípios de Design do Parser:

1. **Sem LLM no Parser**: A extração é determinística e rápida; nenhuma IA generativa é chamada na raspagem para evitar latência excessiva, alucinações e custos operacionais.
2. **Sem Seletores Frágeis por Portal**: Não utiliza seletores CSS como `.post-content` ou `.materia-g1`. O extrator opera com padrões universais da web aberta:
   - Metadados semânticos estruturados: **JSON-LD** (`NewsArticle`, `Article`, `BlogPosting`), incluindo suporte a nós `@graph`.
   - Meta tags padronizadas: **Open Graph** (`og:*`), Twitter Cards e meta tags HTML padrão.
   - Algoritmo heurístico de leitura: **Mozilla Readability** montado sobre **jsdom**.
3. **Fallback Resiliente via Jina Reader**: Se o HTML fornecido for insuficiente (menos de 300 caracteres úteis de texto editorial) ou depender de renderização client-side, o pipeline aciona automaticamente o **Jina Reader API** (`https://r.jina.ai/`) como fallback de tentativa única. Metadados úteis já descobertos localmente são mesclados com o corpo textual do Jina.
4. **Segurança Rigorosa contra SSRF**: Como o backend realiza requisições HTTP para links fornecidos livremente por usuários:
   - Protocolos não-HTTP/HTTPS são rejeitados imediatamente.
   - `localhost`, `127.0.0.1`, `::1` e subdomínios locais são bloqueados.
   - O DNS é resolvido previamente para validar todos os IPs de destino contra faixas privadas (RFC 1918), link-local e metadata endpoints de nuvem.
   - Redirecionamentos HTTP são limitados a no máximo 3 saltos e cada salto revalida o IP do novo destino antes de abrir o socket.

---

## 🛠️ 4. Stack de Tecnologias

A aplicação web foi construída sobre uma base técnica moderna e escalável:

### Core & Frontend

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components e Route Handlers).
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode ativo).
- **Biblioteca de Interface**: [React 19](https://react.dev/).
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) com PostCSS.
- **Ícones & Primitivas**: [Lucide React](https://lucide.dev/), `class-variance-authority` (`cva`), `clsx`, `tailwind-merge`.
- **Temas**: `next-themes` (suporte a Dark / Light Mode).

### Engine de Ingestão e Parsing (Backend)

- **Motor DOM**: [JSDOM](https://github.com/jsdom/jsdom) (sem execução de scripts por segurança).
- **Heurística de Conteúdo**: [@mozilla/readability](https://github.com/mozilla/readability).
- **Cliente HTTP Seguro**: [Undici](https://github.com/nodejs/undici) com dispatcher customizado e DNS pinning para neutralizar DNS rebinding.
- **Validação de Redes/IPs**: [ipaddr.js](https://github.com/whitequark/ipaddr.js) para validação exata de IPv4/IPv6 privados e reservados.
- **Fallback Externo**: [Jina Reader API](https://jina.ai/reader/) (operação em modo JSON puro).
- **Validação de Esquemas**: [Zod v4](https://zod.dev/).

### Persistência & Arquitetura de Software

- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) com Drizzle Kit (migrações prontas para schema relacional).
- **Driver de Banco**: [postgres.js](https://github.com/porsager/postgres) (preparado para PostgreSQL).
- **Padrão de Camadas**: **Clean Architecture** na pasta `src/server/` (`domain`, `application`, `infrastructure`, `presentation`, `composition-root.ts`) e **Atomic/Feature-Sliced** no frontend (`src/views`, `src/widgets`, `src/features`, `src/entities`, `src/components`).

### Qualidade e Testes

- **Testes Unitários & Integração**: [Vitest](https://vitest.dev/) v4 com cobertura v8.
- **Testes End-to-End**: [Playwright](https://playwright.dev/).
- **Linters e Formatadores**: ESLint 9, Prettier, TypeScript-ESLint.
- **Git Hooks**: Husky e Commitlint (Conventional Commits).

---

## 📂 5. Estrutura de Diretórios

```text
web-app/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/news/extract/ # Endpoint POST /api/news/extract
│   │   ├── globals.css       # Tema e estilos globais
│   │   ├── layout.tsx        # Shell da aplicação
│   │   └── page.tsx          # Página principal (atualmente renderiza o Extrator)
│   ├── lib/
│   │   └── news/             # 🧩 Motor do Extrator de Notícias (SSRF, JSON-LD, Readability, Jina)
│   │       ├── types.ts          # Contrato INewsArticle
│   │       ├── schemas.ts        # Schemas Zod de validação
│   │       ├── validate-url.ts   # Sanitização e verificação de segurança de IP/DNS
│   │       ├── fetch-page.ts     # Undici fetch seguro
│   │       ├── parse-json-ld.ts  # Extrator de microdados Schema.org
│   │       ├── parse-metadata.ts # Open Graph e tags padrão
│   │       ├── parse-readability.ts # Parser Mozilla Readability
│   │       ├── merge-extraction.ts  # Consolidação determinística
│   │       ├── jina-reader.ts    # Fallback para Jina Reader
│   │       └── extract-news.ts   # Orquestrador do pipeline
│   ├── server/               # 🏛️ Clean Architecture (Domínio, Casos de Uso, Drizzle)
│   │   ├── domain/           # Entidades, Value Objects e Interfaces de Repositório
│   │   ├── application/      # Casos de uso e serviços de aplicação
│   │   ├── infrastructure/   # Implementação Drizzle e conexões de infraestrutura
│   │   ├── presentation/     # Controllers e adaptadores de entrada
│   │   └── composition-root.ts # Injeção de dependências
│   ├── views/                # Telas completas da aplicação (ex: HomePage)
│   ├── widgets/              # Componentes complexos (ex: NewsExtractor)
│   ├── features/             # Ações e fluxos de negócio do frontend
│   ├── entities/             # Modelos e tipos do frontend
│   └── components/           # Componentes atômicos e primitivas de UI
├── docs/
│   └── architecture.md       # Regras e limites arquiteturais de importação
├── tests/                    # Suíte de testes unitários e de integração
└── validation/               # Relatórios e evidências de testes reais de rede
```

---

## 🔌 6. Contrato da API (`/api/news/extract`)

O endpoint recebe uma requisição `POST` com a URL que se deseja extrair:

### Requisição

```http
POST /api/news/extract
Content-Type: application/json

{
  "url": "https://g1.globo.com/politica/noticia/exemplo.ghtml"
}
```

### Resposta de Sucesso (200 OK)

```json
{
  "url": "https://g1.globo.com/politica/noticia/exemplo.ghtml",
  "canonicalUrl": "https://g1.globo.com/politica/noticia/exemplo.ghtml",
  "title": "Manchete da Notícia Extraída",
  "description": "Subtítulo ou resumo da matéria.",
  "authors": ["Nome do Jornalista"],
  "publishedAt": "2026-09-08T14:30:00-03:00",
  "modifiedAt": null,
  "content": "Texto integral da matéria limpo de menus e scripts...",
  "imageUrl": "https://s2.glbimg.com/imagem.jpg",
  "publisher": "g1",
  "language": "pt-BR",
  "extractionMethod": "local",
  "usedFallback": false
}
```

_Caso o fallback remoto tenha sido acionado, `extractionMethod` será `"jina"` e `usedFallback` será `true`._

### Códigos de Erro Padronizados

- `400 INVALID_URL`: Formato de URL inválido ou não pertencente aos protocolos `http`/`https`.
- `400 UNSAFE_URL`: Destino perigoso bloqueado por SSRF (localhost, IP privado, link-local ou metadata).
- `404 NOT_FOUND`: O servidor de origem retornou status 404/410.
- `422 EXTRACTION_FAILED`: A página foi baixada com sucesso, mas não continha texto jornalístico suficiente (menos de 300 caracteres) mesmo após tentativa de fallback.
- `500 INTERNAL_ERROR`: Erro inesperado de execução no servidor (stack traces são omitidos por segurança).

---

## 🚀 7. Como Executar o Projeto Localmente

### Pré-requisitos

- **Node.js**: `24.15` ou superior (compatível com Node 22.22.2+).
- **Gerenciador de Pacotes**: `pnpm` (versão 11+ recomendada) ou `npm`.

### Passos de Instalação e Execução

```powershell
# 1. Navegar até o diretório da aplicação
Set-Location -LiteralPath 'C:\Users\CUL7CA\Desktop\ElDorado\app\web-app'

# 2. Instalar as dependências
pnpm install

# 3. Iniciar o servidor de desenvolvimento (escuta em 127.0.0.1)
pnpm dev
```

Abra seu navegador em <http://127.0.0.1:3000>.

> 💡 **Variáveis de Ambiente**:  
> A chave do Jina Reader (`JINA_API_KEY`) é totalmente **opcional** para desenvolvimento local. Se desejar configurá-la, copie `.env.example` para `.env.local` e preencha o valor no arquivo local. Nunca use o prefixo `NEXT_PUBLIC_` para manter a chave segura no servidor.

### Comandos de Teste e Validação

```powershell
# Executar suíte completa de validação (lint + typecheck + testes unitários + build)
pnpm validate

# Executar testes unitários com Vitest
pnpm test:unit

# Executar verificação de tipos TypeScript
pnpm typecheck

# Executar testes E2E com Playwright
pnpm test:e2e
```

---

## 🤖 8. Guia para IAs e Futuros Desenvolvedores (Roadmap de Implementação)

> **Instruções Especiais para Assistentes de IA e Engenheiros que continuarem este repositório:**

Você está trabalhando no projeto **Olimpo**. O objetivo final não é ser apenas um extrator de notícias, mas sim a **aplicação completa de jogo educativo** (modos multiplayer e solo) descrita neste documento.

Ao implementar novas funcionalidades, siga as seguintes diretrizes:

1. **Implementação da Interface de Jogo**:
   - Desenvolva os componentes para as 5 telas mapeadas na arquitetura de telas (Lobby, Gameplay/HUD, Placar, Tutorial e Criador de Desafios).
2. **Integre o News Parser ao Criador de Desafios**:
   - Na Tela 5 (_Enviar Notícia_), em vez de obrigar o usuário a digitar tudo manualmente, permita que ele cole uma URL pública.
   - Utilize a rota `POST /api/news/extract` para preencher automaticamente a manchete, fonte sugerida, resumo e imagem. O usuário precisará apenas definir o gabarito secreto (Fato ou Fake) e a explicação.
3. **Respeite a Separação em Camadas**:
   - Mantenha as regras de negócio de salas, pontuação de blefe e rodadas dentro de `src/server/domain/` e `src/server/application/`.
   - Utilize o Drizzle ORM já configurado em `src/server/infrastructure/database/drizzle/` para persistir partidas, rodadas, votos e estatísticas de jogadores.
   - Não acesse bancos de dados nem bibliotecas de servidor diretamente dentro de componentes cliente (`src/features`, `src/widgets`).
4. **Comunicação em Tempo Real**:
   - Para o multiplayer (sincronização do lobby, votos e cronômetro coletivo), utilize WebSockets, Server-Sent Events (SSE) ou bibliotecas de presença em tempo real.
5. **A Preservação da PoC**:
   - Mantenha o widget `NewsExtractor` acessível em uma rota dedicada (ex: `/admin/parser` ou `/tools/extractor`) para testes isolados do motor de scraping.

---

## 📚 9. Referências e Documentação Adicional

- [Documento de Arquitetura de Software](docs/architecture.md)
- [Relatório de Validação de Rede em Produção](validation/REPORT.md)
- [Jina Reader: Documentação Oficial](https://github.com/jina-ai/reader#using-request-headers)
