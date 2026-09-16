## Context

O projeto utiliza Next.js (apenas como API backend), PostgreSQL com Drizzle ORM e adota uma arquitetura em camadas orientada a features (**Feature-First Layered Architecture**). As operações mutáveis são executadas via Server Actions com validação Zod. O ambiente local é executado diretamente na máquina host (sem Docker no momento).

Consulte `proposal.md` para a motivação e os arquivos em `specs/` para os requisitos detalhados de cada capability.

## Goals / Non-Goals

**Goals:**
- Implementar autenticação segura e leve com registro, login e logout usando JWT em cookies `httpOnly` e hash de senhas (`bcryptjs` + `jose`).
- Implementar uma arquitetura modular Feature-First em `src/app/server/features/{feature}` encapsulando `entities`, `usecase`, `repositories`, `actions` e `tests`.
- Manter o Repository Pattern com Injeção de Dependência (DI) em cada feature.
- Centralizar conexões compartilhadas (Drizzle DB client e Redis singleton) em `src/app/server/shared`.
- Suportar salas temporárias com PIN ("XXX XXX"), playlist de N notícias (rodadas) e votação em 3 tiers ('reliable', 'uncertain', 'unreliable').
- Utilizar Redis (`ioredis`) para gerenciar estado efêmero de salas ativas, placar em tempo real e canais de Pub/Sub.
- Fornecer streaming em tempo real via Server-Sent Events (SSE) nativo no Next.js (`GET /api/rooms/[pin]/events`).
- Mockar serviço de análise de IA para prover feedbacks explicativos imediatos no fechamento de cada rodada.

**Non-Goals:**
- Modificações em componentes visuais ou interfaces de usuário do frontend.
- Uso de contêineres Docker neste ciclo de desenvolvimento.
- Integração com provedores externos de WebSocket (ex: Pusher, Socket.io dedicado em porta paralela).
- Provedores sociais externos (OAuth) ou magic links (foco em credenciais com JWT em cookies).

## Decisions

### 1. Autenticação com JWT em Cookies e Hash de Senhas
- **Decisão:** Implementar a feature `auth` em `src/app/server/features/auth/`:
  - **Hash de Senha:** `bcryptjs` com salt rounds = 10 para hash assíncrono seguro sem compilação de binários nativos.
  - **Token JWT:** Biblioteca `jose` para geração e verificação de tokens assinados com chave secreta (`AUTH_SECRET`). O payload contém `{ sub: userId, email, name }` com expiração de 7 dias.
  - **Cookies:** Gerenciados nativamente via `cookies()` do `next/headers` nas Server Actions:
    `{ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 }`.
  - **Resolução de Sessão:** Helper reutilizável `getCurrentUserSession()` para extrair o usuário autenticado nas Server Actions protegidas (como criação de salas e submissão de votos).
- **Alternativas consideradas:** Sessão em banco relacional com tokens de sessão stateful (rejeitado por exigir consultas adicionais ao banco a cada requisição, enquanto JWT é stateless e rápido).

### 2. Organização em Camadas Feature-First (`src/app/server/features/{feature}`)
- **Decisão:** Estruturar o backend modularmente por feature. Cada feature é autocontida contendo suas próprias camadas e testes:
  ```text
  src/app/server/features/{feature}/
  ├── entities/        # Entidades puras e Value Objects do domínio da feature
  ├── usecase/         # Casos de uso (Application Services) com a regra de negócio
  ├── repositories/    # Interfaces de repositório e implementações concretas (Drizzle/Postgres e Redis)
  ├── actions/         # Server Actions expostas com validação Zod
  └── tests/           # Testes unitários (TDD) específicos da feature
  ```
  Infraestrutura compartilhada:
  ```text
  src/app/server/shared/
  ├── database/        # Client do Drizzle e schemas globais
  └── redis/           # Client singleton do ioredis
  ```
- **Alternativas consideradas:** Camadas globais separadas (`src/server/domain`, `src/server/application`, `src/server/infrastructure`) — substituídas pela estrutura Feature-First para maior coesão e facilidade de manutenção por funcionalidade.

### 3. DDL e Drizzle Schema: Playlist de Notícias e Votação em 3 Opções
- **Decisão:** Ajustar as tabelas para suportar partidas com playlists de N rodadas e votos em 3 opções:
  - Enums: `ml_target_type` e `vote_option_type` com os valores `('reliable', 'uncertain', 'unreliable')`.
  - Tabela `rooms`: Campos `current_round` e `total_rounds`.
  - Tabela `room_playlist_items`: Relacionamento 1:N entre `rooms` e `news_articles` com ordenação `round_order` (1..N).
  - Tabela `news_votes`: Vinculada a `room_playlist_items` e `user_id`, garantindo unicidade por participante por rodada.
- **Alternativas consideradas:** Armazenar array de IDs de notícias em coluna JSONB dentro de `rooms` (rejeitado por dificultar integridade referencial com `news_articles` e rastreamento relacional de votos).

### 4. Redis para Estado Efêmero, Leaderboard e Pub/Sub
- **Decisão:** Utilizar `ioredis` para três responsabilidades principais:
  - **Room State & PIN Lookup:** Chave `room:pin:<pin>` mapeando PIN para o ID da sala e status para buscas O(1).
  - **Live Leaderboard:** Redis Sorted Set (`ZADD` / `ZREVRANGE`) na chave `room:<id>:scores` para manter o ranking atualizado em tempo real com baixa latência.
  - **Event Pub/Sub:** Publicar eventos de domínio (`MEMBER_JOINED`, `VOTE_CAST`, `ROUND_COMPLETED`, `MATCH_FINISHED`) no canal `room:<pin>`.
- **Alternativas consideradas:** Manter todo o estado exclusivamente no PostgreSQL (rejeitado porque requisições frequentes de polling/atualização de placar a cada voto sobrecarregariam o banco relacional).

### 5. Server-Sent Events (SSE) para Tempo Real Unidirecional
- **Decisão:** Expor a rota `src/app/api/rooms/[pin]/events/route.ts` retornando um `ReadableStream` com `text/event-stream`. Quando um participante conecta, o endpoint subscreve no canal Redis `room:<pin>` e repassa as mensagens instantaneamente. Ao receber abort signal (`request.signal`), a conexão Redis é encerrada.
- **Alternativas consideradas:** WebSockets via servidor dedicado na porta 3001 ou custom server (rejeitado para evitar múltiplos processos, dependências de portas paralelas e complexidade no ciclo de build do Next.js).

### 6. Mock AI Service com Explicabilidade
- **Decisão:** Implementar `MockAIAnalysisService` dentro de `src/app/server/features/ai-feedback`. O mock avalia a notícia, retorna a classificação alvo e gera 2 a 3 argumentos analíticos simulados, permitindo testes end-to-end do fluxo antes de plugar um LLM real.
- **Alternativas consideradas:** Integrar diretamente uma API externa de LLM (rejeitado no momento conforme premissa do projeto de usar IA mockada).

## Risks / Trade-offs

- **[Risco] Invalidação imediata de JWT no logout:** Como o JWT é stateless, revogar um token antes do tempo de expiração geralmente exige blacklist no Redis.
  - *Mitigação:* Como a sessão usa cookies `httpOnly`, o logout limpa o cookie no cliente imediatamente. Para segurança adicional em partidas ativas, a expiração do token é de 7 dias e pode ser checada contra o status do usuário se necessário.
- **[Risco] Conexões SSE presas ou vazamento no Redis:** Se clientes fecharem o navegador abruptamente, conexões abertas com o Redis poderiam se acumular.
  - *Mitigação:* Vincular o ciclo de vida do subscriber do Redis diretamente ao `request.signal.addEventListener("abort")`, fechando o client duplicado imediatamente.
- **[Risco] Concorrência no último voto da rodada:** Dois jogadores votando simultaneamente poderiam tentar disparar o encerramento da rodada duas vezes.
  - *Mitigação:* Usar operação atômica de contagem no Redis (`INCR` ou `SCARD` dos votos da rodada) ou transação no banco de dados para garantir que apenas o gatilho final processe o fechamento da rodada e a chamada de IA.
