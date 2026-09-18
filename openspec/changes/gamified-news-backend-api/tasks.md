<!--
Branch recomendada: feat/gamified-backend-rooms-api
Commit convention: Conventional Commits (feat, fix, test, refactor, chore)
Regra: Aguardar confirmação do usuário após concluir cada grupo inteiro de tasks (ex: Grupo 1, Grupo 2...).
-->

## 1. Shared Infrastructure & Database Setup

- [x] 1.1 Instalar dependências `ioredis`, `@types/ioredis`, `bcryptjs`, `@types/bcryptjs` e `jose` em `web-app` e validar compilação com `pnpm typecheck`
- [x] 1.2 Configurar clients compartilhados em `src/server/shared`: Drizzle DB client (`src/server/shared/database/client.ts`) e Redis singleton (`src/server/shared/redis/client.ts`) com leitura de variáveis de ambiente
- [x] 1.3 Definir Drizzle schemas e enums (`users`, `rooms`, `room_members`, `room_playlist_items`, `news_articles`, `news_analyses`, `news_votes`, `global_challenges`, `global_challenge_answers`) em `src/server/shared/database/schemas` e exportar no index
- [x] 1.4 Gerar migrações Drizzle com `pnpm db:generate` e validar os scripts SQL gerados

*Sugestão de commit:* `feat(db): setup shared drizzle schemas, migrations and redis client`

## 2. Feature Auth - Registration, Login & Session (TDD)

- [x] 2.1 Criar estrutura da feature em `src/app/api/auth/` com `entities/`, `usecase/`, `repositories/`, `actions/` e `tests/`
- [x] 2.2 Escrever testes unitários em `auth/tests/user-entity.test.ts` e `auth/tests/jwt-cookie.test.ts` para hash de senha, validação de email e geração/verificação de JWT
- [x] 2.3 Implementar entidades e helpers em `auth/entities/` e `auth/repositories/drizzle-user.repository.ts`
- [x] 2.4 Escrever testes e implementar `register.usecase.ts`, `login.usecase.ts` e `logout.usecase.ts`
- [x] 2.5 Implementar Server Actions em `auth/actions/` (`register.action.ts`, `login.action.ts`, `logout.action.ts`) com Zod e cookies httpOnly
- [x] 2.6 Implementar helper de sessão `get-session.usecase.ts` para resolver usuário autenticado a partir do cookie

*Sugestão de commit:* `feat(auth): implement user registration, login with jwt cookies and session resolution with tdd`

## 3. Feature AI Feedback (TDD)

- [x] 3.1 Criar estrutura da feature em `src/app/api/ai-feedback/` com `entities/`, `usecase/`, `repositories/` e `tests/`
- [x] 3.2 Escrever testes unitários em `tests/mock-ai-analysis-service.test.ts` para geração de classificações e argumentos analíticos
- [x] 3.3 Implementar `MockAIAnalysisService` e contrato de interface `IAIAnalysisService` garantindo aprovação dos testes
- [x] 3.4 Implementar `usecase/get-article-analysis.usecase.ts` para orquestrar análise da notícia da rodada

*Sugestão de commit:* `feat(ai-feedback): implement mock ai analysis service and usecase with unit tests`

## 4. Feature Rooms & Playlists (TDD)

- [x] 4.1 Criar estrutura da feature em `src/app/api/rooms/` com `entities/`, `usecase/`, `repositories/`, `actions/` e `tests/`
- [x] 4.2 Escrever testes unitários em `rooms/tests/entities.test.ts` para entidades de Domínio (`Room`, `RoomPin`, `RoomMember`, `PlaylistItem`)
- [x] 4.3 Implementar entidades e Value Objects em `rooms/entities/`
- [x] 4.4 Escrever testes e implementar `rooms/repositories/drizzle-room.repository.ts` e `rooms/repositories/redis-room.repository.ts` (lookup de PIN, cache de status e contagem de participantes)
- [x] 4.5 Escrever testes e implementar casos de uso em `rooms/usecase/`: `create-room.usecase.ts`, `join-room.usecase.ts`, `add-playlist-news.usecase.ts` (com integração a `extract-news`) e `start-game.usecase.ts`
- [x] 4.6 Implementar Server Actions da sala em `rooms/actions/` (`create-room.action.ts`, `join-room.action.ts`, `add-playlist-news.action.ts`, `start-game.action.ts`) protegidas pela sessão com schemas Zod e testes unitários

*Sugestão de commit:* `feat(rooms): implement room lifecycle, playlist management and server actions with tdd`

## 5. Feature News Voting & Round Flow (TDD)

- [x] 5.1 Criar estrutura da feature em `src/app/api/news-voting/` com `entities/`, `usecase/`, `repositories/`, `actions/` e `tests/`
- [x] 5.2 Escrever testes unitários em `news-voting/tests/` para validação de votos nas 3 opções ('reliable', 'uncertain', 'unreliable') e cálculo de pontuação
- [x] 5.3 Implementar entidades e repositórios (`news-voting/repositories/`) para persistência de votos no Postgres e contagem atômica de votos no Redis
- [x] 5.4 Escrever testes e implementar `submit-vote.usecase.ts`: registrar voto, verificar se todos os membros votaram, pontuar rodada e disparar feedback de IA
- [x] 5.5 Escrever testes e implementar `advance-round.usecase.ts` e `finish-match.usecase.ts` com consolidação de XP dos usuários
- [x] 5.6 Implementar Server Actions em `news-voting/actions/` (`submit-vote.action.ts`, `advance-round.action.ts`) protegidas pela sessão com schemas Zod e testes unitários

*Sugestão de commit:* `feat(news-voting): implement 3-tier voting, round evaluation and server actions with tdd`

## 6. Feature Real-Time Events (SSE & Redis Pub/Sub)

- [ ] 6.1 Criar estrutura da feature em `src/app/api/realtime-events/` com `usecase/`, `repositories/` e `tests/`
- [ ] 6.2 Implementar publicador de eventos `realtime-events/repositories/redis-event.publisher.ts` para publicar eventos nos canais `room:<pin>`
- [ ] 6.3 Integrar o publisher nos usecases de `rooms` e `news-voting` para emitir `MEMBER_JOINED`, `ROUND_STARTED`, `ROUND_COMPLETED` e `MATCH_FINISHED`
- [ ] 6.4 Implementar a Route Handler SSE em `src/app/api/rooms/[pin]/events/route.ts` consumindo Redis Pub/Sub com suporte a disconnect limpo (`request.signal`)
- [ ] 6.5 Escrever testes unitários para a rota SSE e para o publisher de eventos

*Sugestão de commit:* `feat(realtime): implement sse streaming route handler and redis pubsub publisher`

## 7. Feature Global Challenges & Full Verification

- [ ] 7.1 Criar estrutura da feature em `src/app/api/global-challenges/` com `entities/`, `usecase/`, `repositories/`, `actions/` e `tests/`
- [ ] 7.2 Implementar casos de uso, repositórios Drizzle e Server Actions para desafios globais de treino com testes unitários
- [ ] 7.3 Executar toda a suíte de testes unitários do projeto (`pnpm test:unit`) garantindo cobertura de todas as features
- [ ] 7.4 Executar validações completas de lint e typecheck (`pnpm typecheck && pnpm lint`)\n\n*Sugestão de commit:* `test(all): add global challenges feature and verify full backend test suite`
