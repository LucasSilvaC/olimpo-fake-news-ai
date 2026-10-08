import type { DocumentationNavigationGroup, IDocumentationPage } from "../model/types";

const repository = "https://github.com/LucasSilvaC/olimpo-fake-news-ai/blob/feat/linguistic-rules";

export const documentationGroupsEn: DocumentationNavigationGroup[] = [
  { id: "produto", title: "Product", description: "Purpose, rooms, and game rules.", icon: "Gamepad2" },
  { id: "engenharia", title: "Engineering", description: "How services and data fit together.", icon: "Workflow" },
  { id: "manutencao", title: "Development", description: "Local setup, quality, and documentation.", icon: "Wrench" },
];

export const documentationPagesEn: IDocumentationPage[] = [
  {
    slug: "visao-geral",
    href: "/",
    title: "Overview",
    summary: "What Olimpo sets out to do and how the game turns news verification into a shared practice.",
    category: "The project",
    group: "produto",
    icon: "Compass",
    readingTime: "3 min read",
    sections: [
      {
        id: "proposito",
        title: "Learn to verify by practicing together",
        blocks: [
          {
            type: "paragraph",
            text: "Olimpo is an educational project that uses games and news challenges to practice critical reading, source comparison, and care before sharing information. The idea is to replace purely passive explanations with decisions made during play.",
          },
          {
            type: "figure",
            src: "/reading-the-newspaper.jpg",
            alt: "A person reading a newspaper on a street in Zurich.",
            caption: "Reading carefully is the first step to investigating a headline.",
            credit: "Michael Kuhn (kuhnmi) · CC BY 2.0",
            creditHref: "https://commons.wikimedia.org/wiki/File:Reading_the_Newspaper_(31997783335).jpg",
          },
          {
            type: "callout",
            title: "Project status",
            text: "Olimpo is in development. This guide summarizes rules and decisions documented in the repository; values and names shown in screens may be visual examples.",
          },
        ],
      },
      {
        id: "experiencia",
        title: "What the experience brings together",
        blocks: [
          {
            type: "cards",
            items: [
              {
                icon: "UsersRound",
                title: "Collaborative rooms",
                description: "A host sets up a room, shares a PIN, and prepares the news sequence for the game.",
              },
              {
                icon: "Newspaper",
                title: "News to investigate",
                description: "Each round presents a news story for participants to assess for reliability.",
              },
              {
                icon: "Trophy",
                title: "Learning through results",
                description: "The round reveals the answer key and updates the room score; at the end, the result adds XP to each profile.",
              },
            ],
          },
        ],
      },
      {
        id: "fontes",
        title: "Sources for this guide",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Project README",
                href: `${repository}/README.md`,
                description: "Olimpo's purpose, audience, and core mechanics.",
              },
              {
                label: "OpenSpec specifications",
                href: "https://github.com/LucasSilvaC/olimpo-fake-news-ai/tree/dev/docs/openspec/specs",
                description: "Domain contracts for rooms, voting, and scoring.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "salas-e-partidas",
    href: "/docs/salas-e-partidas",
    title: "Rooms and games",
    summary: "From the entry PIN to the end of a round: the states and conditions that shape a game.",
    category: "Game flow",
    group: "produto",
    icon: "UsersRound",
    readingTime: "4 min read",
    sections: [
      {
        id: "ciclo-da-sala",
        title: "Game lifecycle",
        blocks: [
          {
            type: "paragraph",
            text: "A room starts in a waiting state. The host shares the PIN, prepares the ordered list of news stories, and starts the game when the room and its content are ready.",
          },
          {
            type: "figure",
            src: "/jornada-da-partida.en.svg",
            alt: "Four-step flow: prepare the room, answer the round, reveal the result, and wrap up the game.",
            caption: "The round connects room setup to the group's result.",
          },
          {
            type: "steps",
            items: [
              {
                title: "Create the room",
                description: "An authenticated user enters a name and round duration. The system creates a room in the waiting state and assigns the host role.",
              },
              {
                title: "Join with a PIN",
                description: "Participants enter the six-digit PIN, displayed in the XXX XXX format. They can join while the room is waiting.",
              },
              {
                title: "Prepare the content",
                description: "The host adds news stories in a defined order. At least one participant and one news story are required to start.",
              },
              {
                title: "Answer and move on",
                description: "Each person submits an answer for the active round. The cycle ends when everyone has answered or the round timer runs out.",
              },
            ],
          },
        ],
      },
      {
        id: "estados-da-sala",
        title: "Room states",
        blocks: [
          {
            type: "table",
            headers: ["State", "What it means", "Participant access"],
            rows: [
              ["Waiting", "The host is setting up the room.", "Participants with a valid PIN can join."],
              ["In progress", "The game's rounds are active.", "New participants are turned away."],
              ["Finished", "The list of rounds is complete.", "New participants are turned away."],
            ],
          },
          {
            type: "callout",
            title: "Minimum duration",
            text: "The room specification rejects durations shorter than 10 seconds and empty names. It also requires content and participants before the game can start.",
          },
        ],
      },
      {
        id: "referencias-salas",
        title: "Sources for the game flow",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Room specification",
                href: `https://github.com/LucasSilvaC/olimpo-fake-news-ai/blob/dev/docs/openspec/specs/rooms/spec.md`,
                description: "PINs, access, playlists, and starting a game.",
              },
              {
                label: "Real-time events specification",
                href: `https://github.com/LucasSilvaC/olimpo-fake-news-ai/blob/dev/docs/openspec/specs/realtime-events/spec.md`,
                description: "Events used to update room state.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "votacao-e-pontuacao",
    href: "/docs/votacao-e-pontuacao",
    title: "Voting and scoring",
    summary: "Answer options, how each round closes, and how the score is calculated.",
    category: "Game rules",
    group: "produto",
    icon: "Trophy",
    readingTime: "3 min read",
    sections: [
      {
        id: "opcoes",
        title: "Three possible answers",
        blocks: [
          {
            type: "paragraph",
            text: "Voting compares each person's assessment with the news story's reference classification. The uncertain option makes room to acknowledge when more evidence is still needed.",
          },
          {
            type: "table",
            headers: ["Interface option", "Domain value", "Meaning"],
            rows: [
              ["Fact", "reliable", "The news story is reliable."],
              ["Uncertain", "uncertain", "More evidence is needed."],
              ["Fake", "unreliable", "The news story is not reliable."],
            ],
          },
        ],
      },
      {
        id: "fechamento",
        title: "How a round closes",
        blocks: [
          {
            type: "steps",
            items: [
              {
                title: "An answer is recorded",
                description: "Each room participant can vote once in the active round. Duplicate answers and answers submitted outside the round are rejected.",
              },
              {
                title: "The system closes the round",
                description: "Scoring starts when all active participants have answered or when the set duration ends.",
              },
              {
                title: "The result updates the score",
                description: "The correct classification earns points. Answers that differ from the answer key follow the game's scoring rules.",
              },
              {
                title: "The game adds XP",
                description: "When the room ends, the accumulated score is converted into permanent XP for each participant's profile.",
              },
            ],
          },
          {
            type: "callout",
            title: "No fixed point values in this guide",
            text: "OpenSpec describes the scoring criteria but does not publish a fixed number of points per action. This guide therefore explains the rules without treating values shown in demo screens as a promise.",
            tone: "info",
          },
        ],
      },
      {
        id: "referencias-votacao",
        title: "Sources for the rules",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Voting specification",
                href: `https://github.com/LucasSilvaC/olimpo-fake-news-ai/blob/dev/docs/openspec/specs/news-voting/spec.md`,
                description: "Allowed options, one vote per person, and round closure.",
              },
              {
                label: "Gamification specification",
                href: `https://github.com/LucasSilvaC/olimpo-fake-news-ai/blob/dev/docs/openspec/specs/gamification/spec.md`,
                description: "Round scores, rankings, and XP at the end of a game.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "extracao-de-noticias",
    href: "/docs/extracao-de-noticias",
    title: "News extraction",
    summary: "How a public URL is validated, read, and converted into structured data for the product.",
    category: "Content input",
    group: "engenharia",
    icon: "Newspaper",
    readingTime: "4 min read",
    sections: [
      {
        id: "entrada",
        title: "From URL to structured article",
        blocks: [
          {
            type: "paragraph",
            text: "The POST /api/news/extract endpoint accepts a URL and returns a normalized article. The extractor looks for structured metadata and editorial text, preserving fields such as title, description, authors, date, content, image, and extraction method.",
          },
          {
            type: "figure",
            src: "/pipeline-de-noticias.en.svg",
            alt: "A pipeline that receives a URL, validates its destination, extracts metadata and text, and returns a normalized article.",
            caption: "The parser combines page metadata with the article's editorial text.",
          },
          {
            type: "table",
            headers: ["Source", "How the pipeline uses it"],
            rows: [
              ["JSON-LD", "Reads structured data such as NewsArticle and Article, including data in graphs."],
              ["Open Graph and meta tags", "Retrieves the title, description, image, and other data published by the page."],
              ["Mozilla Readability", "Identifies the main body text without loading page scripts."],
              ["Jina Reader", "Can be used as a fallback when the locally extracted text is insufficient."],
            ],
          },
        ],
      },
      {
        id: "seguranca-url",
        title: "URLs are treated as untrusted input",
        blocks: [
          {
            type: "cards",
            items: [
              {
                icon: "ShieldCheck",
                title: "Restricted protocols",
                description: "Only HTTP and HTTPS are accepted; other schemes are rejected.",
              },
              {
                icon: "Database",
                title: "Verified destination",
                description: "Local addresses, private networks, and cloud metadata targets are blocked after DNS and IP validation.",
              },
              {
                icon: "GitBranch",
                title: "Limited redirects",
                description: "Each new destination is validated again, and navigation is limited to three redirects.",
              },
            ],
          },
          {
            type: "callout",
            title: "Predictable errors",
            text: "The contract distinguishes invalid URLs, unsafe destinations, missing pages, extraction failures, and internal errors. Internal responses do not expose stack traces.",
          },
        ],
      },
      {
        id: "referencias-parser",
        title: "Technical sources",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "web-app README",
                href: `${repository}/web-app/README.md`,
                description: "Parser pipeline, response, and error codes.",
              },
              {
                label: "News extraction route handler",
                href: `${repository}/web-app/src/app/api/news/extract/route.ts`,
                description: "HTTP adapter that validates the input and coordinates extraction.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "arquitetura",
    href: "/docs/arquitetura",
    title: "Application architecture",
    summary: "How the separation between interface, use cases, and infrastructure supports Olimpo.",
    category: "Technical overview",
    group: "engenharia",
    icon: "Workflow",
    readingTime: "5 min read",
    sections: [
      {
        id: "mapa",
        title: "Responsibilities at a glance",
        blocks: [
          {
            type: "paragraph",
            text: "The web-app uses Next.js and TypeScript at the edge. Actions validate inputs, call use cases, and depend on repository contracts. Concrete implementations connect business rules to data services.",
          },
          {
            type: "figure",
            src: "/arquitetura-olimpo.en.svg",
            alt: "Architecture diagram: Next.js interface, actions, use cases, repository interfaces, and PostgreSQL or Redis.",
            caption: "Dependencies point toward business rules; infrastructure implements the interfaces defined by the application.",
          },
        ],
      },
      {
        id: "camadas",
        title: "How the code is organized",
        blocks: [
          {
            type: "cards",
            items: [
              {
                icon: "BookOpen",
                title: "Interface and routes",
                description: "The App Router exposes pages and endpoints. Views, widgets, and features organize visual flows by capability.",
              },
              {
                icon: "GitBranch",
                title: "Application and domain",
                description: "Use cases coordinate each action; entities and business rules stay separate from the database, network, and framework.",
              },
              {
                icon: "Database",
                title: "Infrastructure",
                description: "Concrete repositories use Drizzle/PostgreSQL for durable records and Redis for transient, high-frequency state.",
              },
            ],
          },
          {
            type: "callout",
            title: "Specifications guide development",
            text: "OpenSpec keeps requirements by capability and records change proposals. Use the specifications to understand contracts; the code and change status show what has been implemented.",
          },
        ],
      },
      {
        id: "fontes-arquitetura",
        title: "Architecture sources",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Architecture document (PDF)",
                href: `${repository}/docs/codigo/arquitetura.pdf`,
                description: "Technical decisions and operational limits of the project.",
              },
              {
                label: "Repository README",
                href: `${repository}/README.md`,
                description: "Overview of the stack and engineering principles.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "dados-e-tempo-real",
    href: "/docs/dados-e-tempo-real",
    title: "Data and real-time updates",
    summary: "Why persistent data and game state follow different paths.",
    category: "Supporting services",
    group: "engenharia",
    icon: "RadioTower",
    readingTime: "3 min read",
    sections: [
      {
        id: "persistencia",
        title: "Every piece of data has a lifecycle",
        blocks: [
          {
            type: "paragraph",
            text: "Persistence is hybrid. PostgreSQL stores data that must remain available, while Redis handles frequent reads and updates tied to active rooms.",
          },
          {
            type: "table",
            headers: ["Service", "Documented responsibility", "Examples"],
            rows: [
              ["PostgreSQL", "Durable relational data and transactional consistency.", "Users, articles, and completed history."],
              ["Redis", "Transient state, fast operations, and event publishing.", "Active PINs, scores, and room channels."],
            ],
          },
        ],
      },
      {
        id: "eventos",
        title: "Updates from the server to clients",
        blocks: [
          {
            type: "paragraph",
            text: "Rooms use Server-Sent Events (SSE) to deliver server events to the browser over a continuous HTTP connection. Redis Pub/Sub distributes room notifications; the Route Handler converts those messages into stream events.",
          },
          {
            type: "steps",
            items: [
              { title: "An action changes the room", description: "The use case updates the necessary state and publishes an event associated with the PIN." },
              { title: "Redis distributes the message", description: "The room channel delivers the update to active listeners." },
              { title: "SSE sends it to the browser", description: "The Route Handler writes the event to the stream and releases resources when the connection ends." },
            ],
          },
          {
            type: "callout",
            title: "Channel scope",
            text: "SSE handles updates from the server to the client. Participant actions continue to arrive through separate routes or Server Actions.",
          },
        ],
      },
      {
        id: "fontes-dados",
        title: "Technical sources",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Architecture document (PDF)",
                href: `${repository}/docs/codigo/arquitetura.pdf`,
                description: "Hybrid persistence, Pub/Sub, and SSE implementation.",
              },
              {
                label: "Real-time events specification",
                href: `https://github.com/LucasSilvaC/olimpo-fake-news-ai/blob/dev/docs/openspec/specs/realtime-events/spec.md`,
                description: "Domain events published by rooms.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "executar-localmente",
    href: "/docs/executar-localmente",
    title: "Run locally",
    summary: "Separate commands for starting the documentation app and the main application.",
    category: "Development environment",
    group: "manutencao",
    icon: "Terminal",
    readingTime: "4 min read",
    sections: [
      {
        id: "requisitos",
        title: "Repository requirements",
        blocks: [
          {
            type: "cards",
            items: [
              { icon: "Terminal", title: "Node.js 24", description: "The docu-app package.json supports Node.js 24 and higher, below version 25." },
              { icon: "Wrench", title: "pnpm 11.10+", description: "The workspace declares pnpm 11.10.0 as its package manager." },
              { icon: "Database", title: "web-app services", description: "The main app also uses PostgreSQL and Redis; the documentation app does not depend on those services." },
            ],
          },
        ],
      },
      {
        id: "iniciar-documentacao",
        title: "Start the documentation app only",
        blocks: [
          {
            type: "paragraph",
            text: "The docu-app is independent: run it from its own folder. It does not need a database or external service configuration.",
          },
          {
            type: "code",
            label: "PowerShell · docu-app folder",
            language: "powershell",
            code: "pnpm install\npnpm dev",
          },
          {
            type: "paragraph",
            text: "The development server listens on 127.0.0.1:3000.",
          },
        ],
      },
      {
        id: "iniciar-aplicativo",
        title: "Start the main application",
        blocks: [
          {
            type: "paragraph",
            text: "For the web-app, start PostgreSQL and Redis, configure local environment variables from the example file, and apply the migrations before starting the server.",
          },
          {
            type: "code",
            label: "PowerShell · repository root",
            language: "powershell",
            code: "Set-Location web-app\npnpm install\nCopy-Item .env.example .env.local\npnpm db:migrate\npnpm dev",
          },
          {
            type: "callout",
            title: "Local configuration",
            text: "Fill .env.local with addresses and credentials for your environment. Do not commit the local file; keep credentials out of the code and repository.",
          },
        ],
      },
      {
        id: "fontes-execucao",
        title: "Run instructions and sources",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "docu-app README",
                href: `${repository}/docu-app/README.md`,
                description: "How to run and how this documentation app is organized.",
              },
              {
                label: "web-app README",
                href: `${repository}/web-app/README.md`,
                description: "Scripts and development details for the main application.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "qualidade-e-acessibilidade",
    href: "/docs/qualidade-e-acessibilidade",
    title: "Quality and accessibility",
    summary: "Engineering checks, existing accessibility features, and the limits of recorded measurements.",
    category: "Product quality",
    group: "manutencao",
    icon: "Accessibility",
    readingTime: "4 min read",
    sections: [
      {
        id: "checks",
        title: "Available checks",
        blocks: [
          {
            type: "table",
            headers: ["Check", "Tool", "Command"],
            rows: [
              ["Types", "TypeScript", "pnpm typecheck"],
              ["Static analysis", "ESLint", "pnpm lint"],
              ["Unit and integration", "Vitest", "pnpm test:unit"],
              ["Browser flows", "Playwright", "pnpm test:e2e"],
            ],
          },
        ],
      },
      {
        id: "recursos-acessiveis",
        title: "Implemented features and what still needs measuring",
        blocks: [
          {
            type: "cards",
            items: [
              {
                icon: "Accessibility",
                title: "Navigation and focus",
                description: "Native controls, associated labels, and visible focus styles appear in documented flows and components.",
              },
              {
                icon: "ShieldCheck",
                title: "Status messages",
                description: "Forms and loading flows use text messages and announcement regions in parts of the product.",
              },
              {
                icon: "Files",
                title: "Partial contrast measurement",
                description: "The evidence JSON measures selected pairs in the code; some combinations do not meet the recorded thresholds.",
              },
            ],
          },
          {
            type: "callout",
            title: "Not a general claim of compliance",
            text: "The available measurements do not cover the DOM, opacity, interaction states, or every screen. They record evidence and open items; they do not prove WCAG AA compliance for the entire product.",
            tone: "warning",
          },
        ],
      },
      {
        id: "fontes-qualidade",
        title: "Sources and evidence",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Architecture and accessibility report",
                href: `${repository}/docs/codigo/arquitetura.pdf`,
                description: "Quality strategy and accessibility evidence.",
              },
              {
                label: "Contrast measurements",
                href: `${repository}/docs/codigo/acessibilidade-contrastes.json`,
                description: "Measured pairs, contrast ratios, and audit scope.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "manter-documentacao",
    href: "/docs/manter-documentacao",
    title: "Maintaining this documentation",
    summary: "Where articles live, how top-level navigation is configured, and how to preserve the content contract.",
    category: "Contribute",
    group: "manutencao",
    icon: "Files",
    readingTime: "3 min read",
    sections: [
      {
        id: "origem-conteudo",
        title: "Content and interface are separate",
        blocks: [
          {
            type: "paragraph",
            text: "Articles live in documentation-pages.ts, documentation-pages.en.ts, and documentation-pages.es.ts. Each file follows the IDocumentationPage contract; page and section IDs stay consistent across languages.",
          },
          {
            type: "table",
            headers: ["File", "Responsibility"],
            rows: [
              ["src/entities/documentation/data/documentation-pages.ts","Portuguese articles: text, sections, figures, references, and navigation groups."],
              ["src/entities/documentation/data/documentation-pages.en.ts","English articles with the same typed structure."],
              ["src/entities/documentation/data/documentation-pages.es.ts","Spanish articles with the same typed structure."],
              ["messages/[locale]/*.json","Static interface text for each language."],
              ["src/entities/documentation/model/types.ts","Typed contract for articles and content blocks."],
              ["src/entities/documentation/index.ts","Selects the content catalog for the current language."],
              ["src/i18n/routing.ts","Supported languages and route prefix rules."],
              ["src/features/documentation-navigation/ui/sidebar-navigation.tsx","Search and grouped sidebar navigation."],
              ["src/views/document/ui/document-page.tsx","Rendering articles, figures, tables, and references."],
            ],
          },
        ],
      },
      {
        id: "criar-artigo",
        title: "Checklist for a new article",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Confirm the source", description: "Prefer current code, OpenSpec specifications, and project documents. Make clear whether information is a rule, implementation, or plan." },
              { title: "Choose a broad topic", description: "Use Product, Engineering, or Development. Keep the sidebar for broad areas and cover subtopics inside each article." },
              { title: "Add visual navigation", description: "Choose a Lucide icon for the article and use SVGs or images with alt text, a caption, and credit." },
              { title: "Add references", description: "Link the document or code that supports each important technical recommendation." },
            ],
          },
          {
            type: "callout",
            title: "Run the documentation app",
            text: "From the docu-app folder, run pnpm install and pnpm dev. The lint and typecheck scripts are defined in package.json.",
          },
        ],
      },
      {
        id: "fonte-docu-app",
        title: "Read also",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "docu-app README",
                href: `${repository}/docu-app/README.md`,
                description: "Technical structure and commands for this application.",
              },
              {
                label: "Lucide icons",
                href: "https://lucide.dev/icons/",
                description: "Catalog of SVG icons used by the interface.",
              },
            ],
          },
        ],
      },
    ],
  },
];
