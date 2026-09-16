## Why

A plataforma precisa de uma API backend robusta e gamificada para desafiar usuários a identificarem notícias falsas (Fake News). Atualmente, existe apenas a funcionalidade isolada de extração de notícias (`extract-news`) e um exemplo mínimo de arquitetura. É necessário implementar os fluxos completos de autenticação (registro, login com JWT em cookies e logout), salas temporárias estilo Kahoot (com PIN e ciclo de vida), playlist de notícias por partida, votação dos participantes em três níveis ('reliable', 'uncertain', 'unreliable'), pontuação em tempo real, feedback explicativo com IA (mockada), atribuição de XP global persistente e desafios globais estáticos.

## What Changes

- **Autenticação & Sessões (`auth`)**: Fluxo de registro de usuário com hash seguro de senha (`bcryptjs`), login com validação de credenciais e emissão de token JWT (`jose`) em cookie `httpOnly`, logout com invalidação do cookie e resolução de sessão autenticada para Server Actions.
- **Salas Temporárias & Playlists (`rooms`)**: Criação e gerenciamento de salas com código PIN único (formato "XXX XXX"), ciclo de vida (`waiting`, `in_progress`, `finished`), expiração temporária, papéis (`host`, `participant`) e associação de playlist de N notícias por partida.
- **Votação e Rodadas (`news-voting`)**: Fluxo de submissão de votos por rodada com 3 opções ('reliable', 'uncertain', 'unreliable'), encerramento automático da rodada quando todos os participantes votarem (ou por tempo limite) e avanço de rodadas pelo host.
- **Feedback de IA Explicativo (`ai-feedback`)**: Integração de serviço de IA (inicialmente mockado) que fornece explicações detalhadas sobre os motivos pelos quais a notícia é confiável, incerta ou não confiável assim que a rodada é finalizada.
- **Gamificação e Leaderboard (`gamification`)**: Sistema de pontuação por rodada armazenado no Redis durante a partida, ranking ao vivo dos participantes, consolidação definitiva de XP no PostgreSQL para cada usuário ao final da partida e suporte a desafios globais de treino.
- **Sincronização em Tempo Real (`realtime-events`)**: Endpoint SSE (`GET /api/rooms/[pin]/events`) consumindo eventos do Redis Pub/Sub disparados pelas Server Actions para notificar os clientes conectados sobre entrada de membros, votos recebidos, encerramento de rodada e placar final.
- **Arquitetura Modular Feature-First**: Organização de cada fatia em `src/app/server/features/{feature}` contendo `entities`, `usecase`, `repositories`, `actions` e `tests`.

## Capabilities

### New Capabilities
- `auth`: Registro de usuários com hash de senha, login com emissão de token JWT em cookies httpOnly, logout e resolução de sessão autenticada.
- `rooms`: Gerenciamento do ciclo de vida de salas, PINs temporários, controle de membros (host/participante) e playlist de notícias com controle de rodadas.
- `news-voting`: Coleta e validação de votos dos participantes por rodada em 3 opções ('reliable', 'uncertain', 'unreliable') e cômputo de acertos.
- `ai-feedback`: Geração de análises e justificativas sobre a veracidade de notícias após conclusão de rodada.
- `gamification`: Cálculo de scores da partida, leaderboard em tempo real e atualização de XP do usuário no encerramento da partida e em desafios globais.
- `realtime-events`: Transmissão de eventos em tempo real para os participantes da sala via Server-Sent Events (SSE) e Redis Pub/Sub.

### Modified Capabilities
<!-- Nenhuma capability existente está sendo modificada -->

## Impact

- **Código & Camadas**:
  - `src/app/server/features/{feature}`: Fatias modulares para cada funcionalidade (`auth`, `rooms`, `news-voting`, `ai-feedback`, `global-challenges`), cada uma contendo `entities/`, `usecase/`, `repositories/`, `actions/` e `tests/`.
  - `src/app/server/shared`: Conexões e clients compartilhados (Drizzle ORM client, schemas e Redis singleton).
  - `src/app/api/rooms/[pin]/events/route.ts`: Endpoint SSE para streaming de eventos de sala.
- **Dependências**: Adição das bibliotecas `ioredis` (e `@types/ioredis`), `bcryptjs` (e `@types/bcryptjs`) e `jose`.
- **Banco de Dados**: Tabelas e enums Drizzle (`users`, `rooms`, `room_members`, `room_playlist_items`, `news_articles`, `news_analyses`, `news_votes`, `global_challenges`, `global_challenge_answers`).
- **Compatibilidade**: O frontend existente permanece intacto. Todas as operações de mutação são expostas como Server Actions com validação Zod e o tempo real é servido via SSE.
