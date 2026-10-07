import type { DocumentationNavigationGroup, IDocumentationPage } from "../model/types";

export const documentationGroups: DocumentationNavigationGroup[] = [
  {
    id: "produto",
    title: "Produto",
    description: "Propósito, salas e regras do jogo.",
    icon: "Gamepad2",
  },
  {
    id: "engenharia",
    title: "Engenharia",
    description: "Como os serviços e dados se organizam.",
    icon: "Workflow",
  },
  {
    id: "manutencao",
    title: "Desenvolvimento",
    description: "Ambiente local, qualidade e documentação.",
    icon: "Wrench",
  },
];

const repository = "https://github.com/LucasSilvaC/olimpo-fake-news-ai/blob/feat/linguistic-rules";

export const documentationPages: IDocumentationPage[] = [
  {
    slug: "visao-geral",
    href: "/",
    title: "Visão geral",
    summary: "O que o Olimpo propõe e como o jogo transforma checagem de notícias em prática compartilhada.",
    category: "O projeto",
    group: "produto",
    icon: "Compass",
    readingTime: "3 min de leitura",
    sections: [
      {
        id: "proposito",
        title: "Aprender a verificar, praticando junto",
        blocks: [
          {
            type: "paragraph",
            text: "O Olimpo é um projeto educacional que usa partidas e desafios de notícias para exercitar leitura crítica, comparação de fontes e cuidado antes de compartilhar uma informação. A proposta é trocar a explicação apenas passiva por decisões feitas durante o jogo.",
          },
          {
            type: "figure",
            src: "/reading-the-newspaper.jpg",
            alt: "Pessoa lendo um jornal em uma rua de Zurique.",
            caption: "Ler com atenção é o primeiro passo para investigar uma manchete.",
            credit: "Michael Kuhn (kuhnmi) · CC BY 2.0",
            creditHref: "https://commons.wikimedia.org/wiki/File:Reading_the_Newspaper_(31997783335).jpg",
          },
          {
            type: "callout",
            title: "Estado do projeto",
            text: "O Olimpo está em desenvolvimento. Este guia resume regras e decisões documentadas no repositório; valores e nomes mostrados em telas podem ser exemplos visuais.",
          },
        ],
      },
      {
        id: "experiencia",
        title: "O que a experiência reúne",
        blocks: [
          {
            type: "cards",
            items: [
              {
                icon: "UsersRound",
                title: "Salas colaborativas",
                description: "Um anfitrião organiza uma sala, compartilha um PIN e prepara a sequência de notícias da partida.",
              },
              {
                icon: "Newspaper",
                title: "Notícias para investigar",
                description: "Cada rodada apresenta uma matéria para que os participantes avaliem sua confiabilidade.",
              },
              {
                icon: "Trophy",
                title: "Aprendizado com resultado",
                description: "A rodada revela o gabarito e atualiza a pontuação da sala; ao final, o resultado consolida XP no perfil.",
              },
            ],
          },
        ],
      },
      {
        id: "fontes",
        title: "Fontes deste guia",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "README do projeto",
                href: `${repository}/README.md`,
                description: "Objetivo, público e mecânicas centrais do Olimpo.",
              },
              {
                label: "Especificações OpenSpec",
                href: "https://github.com/LucasSilvaC/olimpo-fake-news-ai/tree/feat/linguistic-rules/openspec/specs",
                description: "Contratos de domínio para salas, votação e pontuação.",
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
    title: "Salas e partidas",
    summary: "Do PIN de entrada ao encerramento da rodada: estados e condições que organizam uma partida.",
    category: "Fluxo do jogo",
    group: "produto",
    icon: "UsersRound",
    readingTime: "4 min de leitura",
    sections: [
      {
        id: "ciclo-da-sala",
        title: "Ciclo da partida",
        blocks: [
          {
            type: "paragraph",
            text: "Uma sala começa em espera. O anfitrião compartilha o PIN, prepara a lista ordenada de notícias e inicia o jogo quando a sala e o conteúdo estão prontos.",
          },
          {
            type: "figure",
            src: "/jornada-da-partida.svg",
            alt: "Fluxo em quatro etapas: preparar sala, responder à rodada, revelar o resultado e consolidar a partida.",
            caption: "A rodada conecta a preparação da sala ao resultado coletivo.",
          },
          {
            type: "steps",
            items: [
              {
                title: "Criar a sala",
                description: "Uma pessoa autenticada informa o nome e a duração da rodada. O sistema cria a sala no estado de espera e atribui a função de anfitrião.",
              },
              {
                title: "Entrar pelo PIN",
                description: "Participantes informam o PIN de seis dígitos, exibido no formato XXX XXX. A entrada é aceita enquanto a sala estiver aguardando.",
              },
              {
                title: "Preparar o conteúdo",
                description: "O anfitrião associa notícias em uma ordem definida. É necessário haver ao menos uma pessoa participante e uma notícia para iniciar.",
              },
              {
                title: "Responder e avançar",
                description: "Cada pessoa registra uma resposta para a rodada ativa. O ciclo termina quando todos respondem ou quando o tempo da rodada acaba.",
              },
            ],
          },
        ],
      },
      {
        id: "estados-da-sala",
        title: "Estados da sala",
        blocks: [
          {
            type: "table",
            headers: ["Estado", "O que significa", "Entrada de participantes"],
            rows: [
              ["Aguardando", "A sala está sendo preparada pelo anfitrião.", "Aceita participantes com o PIN válido."],
              ["Em andamento", "As rodadas da partida estão ativas.", "Novas entradas são recusadas."],
              ["Finalizada", "A lista de rodadas foi concluída.", "Novas entradas são recusadas."],
            ],
          },
          {
            type: "callout",
            title: "Duração mínima",
            text: "A especificação de salas rejeita duração inferior a 10 segundos e nome vazio. Ela também exige conteúdo e participantes antes do início.",
          },
        ],
      },
      {
        id: "referencias-salas",
        title: "Fontes do fluxo",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Especificação de salas",
                href: `${repository}/openspec/specs/rooms/spec.md`,
                description: "PIN, acesso, playlist e início da partida.",
              },
              {
                label: "Especificação de eventos em tempo real",
                href: `${repository}/openspec/specs/realtime-events/spec.md`,
                description: "Eventos usados para atualizar o estado da sala.",
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
    title: "Votação e pontuação",
    summary: "As opções de resposta, o fechamento de cada rodada e a consolidação do placar.",
    category: "Regras do jogo",
    group: "produto",
    icon: "Trophy",
    readingTime: "3 min de leitura",
    sections: [
      {
        id: "opcoes",
        title: "Três respostas possíveis",
        blocks: [
          {
            type: "paragraph",
            text: "A votação compara a avaliação de cada pessoa com a classificação de referência da notícia. A opção de dúvida mantém espaço para reconhecer quando ainda faltam evidências.",
          },
          {
            type: "table",
            headers: ["Opção na interface", "Valor do domínio", "Leitura"],
            rows: [
              ["Fato", "reliable", "A notícia é confiável."],
              ["Dúvida", "uncertain", "É preciso buscar mais elementos."],
              ["Fake", "unreliable", "A notícia não é confiável."],
            ],
          },
        ],
      },
      {
        id: "fechamento",
        title: "Como uma rodada é fechada",
        blocks: [
          {
            type: "steps",
            items: [
              {
                title: "A resposta é registrada",
                description: "Cada participante da sala pode votar uma vez na rodada ativa. Respostas duplicadas ou enviadas fora da rodada são rejeitadas.",
              },
              {
                title: "O sistema fecha a rodada",
                description: "A apuração começa quando todos os participantes ativos responderam ou quando a duração definida termina.",
              },
              {
                title: "O resultado atualiza o placar",
                description: "A classificação correta recebe pontuação de acerto. Respostas diferentes do gabarito seguem as regras de avaliação do jogo.",
              },
              {
                title: "A partida consolida XP",
                description: "Quando a sala termina, a pontuação acumulada é convertida em XP permanente para o perfil dos participantes.",
              },
            ],
          },
          {
            type: "callout",
            title: "Sem números fixos neste guia",
            text: "O OpenSpec descreve os critérios de pontuação, mas não fixa uma tabela pública de pontos por ação. Por isso, este guia explica as regras sem transformar valores de telas demonstrativas em promessa.",
            tone: "info",
          },
        ],
      },
      {
        id: "referencias-votacao",
        title: "Fontes das regras",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Especificação de votação",
                href: `${repository}/openspec/specs/news-voting/spec.md`,
                description: "Opções permitidas, voto único e fechamento da rodada.",
              },
              {
                label: "Especificação de gamificação",
                href: `${repository}/openspec/specs/gamification/spec.md`,
                description: "Pontuação por rodada, ranking e XP ao final da partida.",
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
    title: "Extração de notícias",
    summary: "Como uma URL pública é validada, lida e convertida em dados estruturados para o produto.",
    category: "Entrada de conteúdo",
    group: "engenharia",
    icon: "Newspaper",
    readingTime: "4 min de leitura",
    sections: [
      {
        id: "entrada",
        title: "Da URL ao artigo estruturado",
        blocks: [
          {
            type: "paragraph",
            text: "O endpoint POST /api/news/extract recebe uma URL e devolve um artigo normalizado. O extrator procura metadados estruturados e texto editorial, preservando campos como título, descrição, autores, data, conteúdo, imagem e método usado na extração.",
          },
          {
            type: "figure",
            src: "/pipeline-de-noticias.svg",
            alt: "Pipeline que recebe uma URL, valida o destino, extrai metadados e texto, e devolve um artigo normalizado.",
            caption: "O parser combina fontes de metadados da página com leitura do conteúdo editorial.",
          },
          {
            type: "table",
            headers: ["Fonte", "Uso no pipeline"],
            rows: [
              ["JSON-LD", "Lê dados estruturados como NewsArticle e Article, inclusive em grafos."],
              ["Open Graph e metatags", "Recupera título, descrição, imagem e dados publicados pela página."],
              ["Mozilla Readability", "Identifica o corpo principal do texto sem carregar scripts da página."],
              ["Jina Reader", "Pode ser usado como tentativa de fallback quando o texto local é insuficiente."],
            ],
          },
        ],
      },
      {
        id: "seguranca-url",
        title: "A URL é tratada como entrada não confiável",
        blocks: [
          {
            type: "cards",
            items: [
              {
                icon: "ShieldCheck",
                title: "Protocolos restritos",
                description: "A entrada aceita apenas HTTP e HTTPS; outros esquemas são recusados.",
              },
              {
                icon: "Database",
                title: "Destino verificado",
                description: "Endereços locais, redes privadas e alvos de metadados de nuvem são bloqueados após validação de DNS e IP.",
              },
              {
                icon: "GitBranch",
                title: "Redirecionamentos limitados",
                description: "Cada novo destino é revalidado e a navegação é limitada a três redirecionamentos.",
              },
            ],
          },
          {
            type: "callout",
            title: "Erros previsíveis",
            text: "O contrato diferencia URL inválida, destino inseguro, página inexistente, falha de extração e erro interno. A resposta interna não expõe stack traces.",
          },
        ],
      },
      {
        id: "referencias-parser",
        title: "Fontes técnicas",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "README do web-app",
                href: `${repository}/web-app/README.md`,
                description: "Pipeline do parser, resposta e códigos de erro.",
              },
              {
                label: "Route handler de extração",
                href: `${repository}/web-app/src/app/api/news/extract/route.ts`,
                description: "Adaptador HTTP que valida a entrada e orquestra a extração.",
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
    title: "Arquitetura da aplicação",
    summary: "A separação entre interface, casos de uso e infraestrutura que sustenta o Olimpo.",
    category: "Visão técnica",
    group: "engenharia",
    icon: "Workflow",
    readingTime: "5 min de leitura",
    sections: [
      {
        id: "mapa",
        title: "Mapa de responsabilidades",
        blocks: [
          {
            type: "paragraph",
            text: "O web-app usa Next.js e TypeScript na borda. As ações validam entradas, chamam casos de uso e dependem de contratos de repositório. Implementações concretas conectam regras de negócio aos serviços de dados.",
          },
          {
            type: "figure",
            src: "/arquitetura-olimpo.svg",
            alt: "Diagrama da arquitetura: interface Next.js, actions, casos de uso, interfaces de repositório e PostgreSQL ou Redis.",
            caption: "As dependências apontam para regras de negócio; a infraestrutura implementa as interfaces definidas pela aplicação.",
          },
        ],
      },
      {
        id: "camadas",
        title: "Como o código é organizado",
        blocks: [
          {
            type: "cards",
            items: [
              {
                icon: "BookOpen",
                title: "Interface e rotas",
                description: "O App Router expõe páginas e endpoints. Views, widgets e features organizam os fluxos visuais por funcionalidade.",
              },
              {
                icon: "GitBranch",
                title: "Aplicação e domínio",
                description: "Use cases coordenam cada ação; entidades e regras de negócio permanecem separadas de banco, rede e framework.",
              },
              {
                icon: "Database",
                title: "Infraestrutura",
                description: "Repositórios concretos usam Drizzle/PostgreSQL para registros duráveis e Redis para estado transitório e alta frequência.",
              },
            ],
          },
          {
            type: "callout",
            title: "Governança por especificação",
            text: "OpenSpec mantém requisitos por capacidade e registra propostas de mudança. Use as especificações para entender contratos; o código e o status da mudança mostram o que já está implementado.",
          },
        ],
      },
      {
        id: "fontes-arquitetura",
        title: "Fontes de arquitetura",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Documento de arquitetura (PDF)",
                href: `${repository}/docs/codigo/arquitetura.pdf`,
                description: "Decisões técnicas e limites operacionais do projeto.",
              },
              {
                label: "README do repositório",
                href: `${repository}/README.md`,
                description: "Resumo da stack e dos pilares de engenharia.",
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
    title: "Dados e tempo real",
    summary: "Por que dados persistentes e estado de partida usam caminhos diferentes.",
    category: "Serviços de apoio",
    group: "engenharia",
    icon: "RadioTower",
    readingTime: "3 min de leitura",
    sections: [
      {
        id: "persistencia",
        title: "Cada dado tem um ciclo de vida",
        blocks: [
          {
            type: "paragraph",
            text: "A persistência é híbrida. PostgreSQL guarda dados que precisam continuar disponíveis, enquanto Redis atende leituras e atualizações frequentes ligadas às salas ativas.",
          },
          {
            type: "table",
            headers: ["Serviço", "Responsabilidade documentada", "Exemplos"],
            rows: [
              ["PostgreSQL", "Dados relacionais duráveis e consistência transacional.", "Usuários, artigos e histórico concluído."],
              ["Redis", "Estado transitório, operações rápidas e publicação de eventos.", "PINs ativos, placar e canais das salas."],
            ],
          },
        ],
      },
      {
        id: "eventos",
        title: "Atualizações do servidor para os clientes",
        blocks: [
          {
            type: "paragraph",
            text: "As salas usam Server-Sent Events (SSE) para entregar eventos do servidor ao navegador por uma conexão HTTP contínua. O Redis Pub/Sub distribui notificações da sala; o Route Handler converte essas mensagens em eventos do stream.",
          },
          {
            type: "steps",
            items: [
              { title: "Uma ação altera a sala", description: "O caso de uso atualiza o estado necessário e publica um evento associado ao PIN." },
              { title: "Redis distribui a mensagem", description: "O canal da sala entrega a atualização aos listeners ativos." },
              { title: "SSE envia ao navegador", description: "O Route Handler escreve o evento no stream e libera recursos quando a conexão termina." },
            ],
          },
          {
            type: "callout",
            title: "Escopo do canal",
            text: "SSE atende atualizações do servidor para o cliente. Ações do participante continuam chegando por rotas ou Server Actions separadas.",
          },
        ],
      },
      {
        id: "fontes-dados",
        title: "Fontes técnicas",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Documento de arquitetura (PDF)",
                href: `${repository}/docs/codigo/arquitetura.pdf`,
                description: "Persistência híbrida, Pub/Sub e implementação SSE.",
              },
              {
                label: "Especificação de eventos em tempo real",
                href: `${repository}/openspec/specs/realtime-events/spec.md`,
                description: "Eventos de domínio publicados pelas salas.",
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
    title: "Executar localmente",
    summary: "Comandos separados para iniciar a documentação e o aplicativo principal.",
    category: "Ambiente de desenvolvimento",
    group: "manutencao",
    icon: "Terminal",
    readingTime: "4 min de leitura",
    sections: [
      {
        id: "requisitos",
        title: "Requisitos do repositório",
        blocks: [
          {
            type: "cards",
            items: [
              { icon: "Terminal", title: "Node.js 24", description: "O package.json do docu-app aceita Node.js a partir da versão 24 e abaixo da 25." },
              { icon: "Wrench", title: "pnpm 11.10+", description: "O workspace declara pnpm 11.10.0 como gerenciador de pacotes." },
              { icon: "Database", title: "Serviços do web-app", description: "O aplicativo principal também usa PostgreSQL e Redis; a documentação não depende desses serviços." },
            ],
          },
        ],
      },
      {
        id: "iniciar-documentacao",
        title: "Iniciar apenas a documentação",
        blocks: [
          {
            type: "paragraph",
            text: "O docu-app é independente: execute-o a partir da pasta própria. Ele não precisa de banco de dados nem de configuração de serviços externos.",
          },
          {
            type: "code",
            label: "PowerShell · pasta docu-app",
            language: "powershell",
            code: "pnpm install\npnpm dev",
          },
          {
            type: "paragraph",
            text: "O servidor de desenvolvimento escuta em 127.0.0.1:3000.",
          },
        ],
      },
      {
        id: "iniciar-aplicativo",
        title: "Iniciar o aplicativo principal",
        blocks: [
          {
            type: "paragraph",
            text: "Para o web-app, inicie PostgreSQL e Redis, configure as variáveis locais a partir do arquivo de exemplo e aplique as migrações antes de abrir o servidor.",
          },
          {
            type: "code",
            label: "PowerShell · raiz do repositório",
            language: "powershell",
            code: "Set-Location web-app\npnpm install\nCopy-Item .env.example .env.local\npnpm db:migrate\npnpm dev",
          },
          {
            type: "callout",
            title: "Configuração local",
            text: "Preencha .env.local com endereços e credenciais do seu ambiente. Não versione o arquivo local; mantenha as credenciais fora do código e do repositório.",
          },
        ],
      },
      {
        id: "fontes-execucao",
        title: "Referências de execução",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "README do docu-app",
                href: `${repository}/docu-app/README.md`,
                description: "Execução e organização desta aplicação de documentação.",
              },
              {
                label: "README do web-app",
                href: `${repository}/web-app/README.md`,
                description: "Scripts e detalhes de desenvolvimento do aplicativo principal.",
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
    title: "Qualidade e acessibilidade",
    summary: "Checks de engenharia, recursos acessíveis existentes e limites das medições registradas.",
    category: "Qualidade do produto",
    group: "manutencao",
    icon: "Accessibility",
    readingTime: "4 min de leitura",
    sections: [
      {
        id: "checks",
        title: "Checks disponíveis",
        blocks: [
          {
            type: "table",
            headers: ["Verificação", "Ferramenta", "Comando"],
            rows: [
              ["Tipos", "TypeScript", "pnpm typecheck"],
              ["Análise estática", "ESLint", "pnpm lint"],
              ["Unitários e integração", "Vitest", "pnpm test:unit"],
              ["Fluxos no navegador", "Playwright", "pnpm test:e2e"],
            ],
          },
        ],
      },
      {
        id: "recursos-acessiveis",
        title: "Recursos implementados e o que ainda precisa ser medido",
        blocks: [
          {
            type: "cards",
            items: [
              {
                icon: "Accessibility",
                title: "Navegação e foco",
                description: "Controles nativos, rótulos associados e estilos de foco visível aparecem em fluxos e componentes documentados.",
              },
              {
                icon: "ShieldCheck",
                title: "Mensagens de estado",
                description: "Formulários e carregamentos usam mensagens textuais e regiões de anúncio em pontos do produto.",
              },
              {
                icon: "Files",
                title: "Medição parcial de contraste",
                description: "O JSON de evidências mede pares selecionados do código; algumas combinações não atingem os limiares anotados.",
              },
            ],
          },
          {
            type: "callout",
            title: "Não é uma declaração geral de conformidade",
            text: "As medições disponíveis não cobrem o DOM, opacidades, estados de interação nem todas as telas. Elas registram evidências e pendências; não comprovam conformidade WCAG AA do produto inteiro.",
            tone: "warning",
          },
        ],
      },
      {
        id: "fontes-qualidade",
        title: "Fontes e evidências",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Relatório de arquitetura e acessibilidade",
                href: `${repository}/docs/codigo/arquitetura.pdf`,
                description: "Estratégia de qualidade e evidências de acessibilidade.",
              },
              {
                label: "Medições de contraste",
                href: `${repository}/docs/codigo/acessibilidade-contrastes.json`,
                description: "Pares medidos, razão de contraste e escopo da auditoria.",
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
    title: "Manter esta documentação",
    summary: "Onde ficam os artigos, como a navegação macro é configurada e como preservar o contrato de conteúdo.",
    category: "Contribuir",
    group: "manutencao",
    icon: "Files",
    readingTime: "3 min de leitura",
    sections: [
      {
        id: "origem-conteudo",
        title: "Conteúdo e interface ficam separados",
        blocks: [
          {
            type: "paragraph",
            text: "Os artigos vivem em documentation-pages.ts, documentation-pages.en.ts e documentation-pages.es.ts. Cada arquivo segue o contrato IDocumentationPage; IDs de p?ginas e se??es permanecem est?veis entre idiomas.",
          },
          {
            type: "table",
            headers: ["Arquivo", "Responsabilidade"],
            rows: [
              ["src/entities/documentation/data/documentation-pages.ts","Artigos em portugu?s: textos, se??es, figuras, refer?ncias e grupos de navega??o."],
              ["src/entities/documentation/data/documentation-pages.en.ts","Artigos em ingl?s com a mesma estrutura tipada."],
              ["src/entities/documentation/data/documentation-pages.es.ts","Artigos em espanhol com a mesma estrutura tipada."],
              ["messages/[locale]/*.json","Textos est?ticos da interface por idioma."],
              ["src/entities/documentation/model/types.ts","Contrato tipado dos artigos e blocos de conte?do."],
              ["src/entities/documentation/index.ts","Sele??o do cat?logo de conte?do conforme o idioma."],
              ["src/i18n/routing.ts","Idiomas dispon?veis e regras de prefixo nas rotas."],
              ["src/features/documentation-navigation/ui/sidebar-navigation.tsx","Busca e navega??o agrupada da barra lateral."],
              ["src/views/document/ui/document-page.tsx","Renderiza??o de artigos, figuras, tabelas e refer?ncias."],
            ],
          },
        ],
      },
      {
        id: "criar-artigo",
        title: "Checklist para um artigo novo",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Confirme a fonte", description: "Prefira código atual, especificações OpenSpec e documentos do projeto. Marque claramente se a informação é regra, implementação ou plano." },
              { title: "Escolha um macrotema", description: "Use Produto, Engenharia ou Desenvolvimento. Reserve o menu lateral para áreas amplas; detalhe subtópicos dentro do artigo." },
              { title: "Inclua navegação visual", description: "Escolha um ícone Lucide para o artigo e use figuras SVG ou imagens com texto alternativo, legenda e crédito." },
              { title: "Adicione referências", description: "Aponte para o documento ou código que sustenta cada orientação técnica importante." },
            ],
          },
          {
            type: "callout",
            title: "Como executar a documentação",
            text: "Na pasta docu-app, use pnpm install e pnpm dev. Os scripts de lint e typecheck estão definidos no package.json.",
          },
        ],
      },
      {
        id: "fonte-docu-app",
        title: "Leia também",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "README do docu-app",
                href: `${repository}/docu-app/README.md`,
                description: "Estrutura técnica e comandos desta aplicação.",
              },
              {
                label: "Ícones Lucide",
                href: "https://lucide.dev/icons/",
                description: "Catálogo dos ícones SVG usados pela interface.",
              },
            ],
          },
        ],
      },
    ],
  },
];
