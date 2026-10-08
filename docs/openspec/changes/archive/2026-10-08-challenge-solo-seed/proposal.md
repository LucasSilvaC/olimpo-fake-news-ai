# Proposal

## Why

The application currently supports multiplayer rooms with real-time SSE events, but lacks an accessible, friction-free solo challenge mode ("Fazer desafios") where individual users can practice detecting fake news independently. Additionally, the development environment requires a streamlined automated seed mechanism to fetch and populate real G1 news articles into the database upon `docker compose up`, with mocked classification targets to enable rich solo gameplay out of the box.

## What Changes

- **Solo Challenge Flow & Page**: Introduce a dedicated protected `/challenge` page (and link it to the "Fazer desafios" card in `OlimpoHomePage`) that lets users play through a sequence of curated news challenges with immediate feedback.
- **View Abstraction & Decoupling**: Decouple `NewsCheckStage` and `RoundScoreboardStage` from multiplayer room actions and SSE/Redis dependencies, allowing them to accept optional custom vote and progression handlers for solo play, while reusing `MatchScoreboardStage` for the final challenge summary.
- **Automated G1 News Population Script**: Create `scripts/populate-challenges.ts` (mapped to `pnpm db:seed`) that takes 10 real G1 news URLs, extracts article data via `extractNews`, assigns mocked `MLTargetType` classifications (`reliable`, `unreliable`, `uncertain`), and inserts records into `news_articles` and `global_challenges` idempotently.
- **Docker Compose Integration**: Add a `seed` service in `compose.yaml` (running `pnpm db:seed` after `migrate` finishes successfully) so new database instances automatically come pre-populated on `docker compose up`.

## Capabilities

### New Capabilities
- `solo-challenges`: Interactive multi-round solo challenge game mode integrating news voting, round feedback/scoreboard, and match finale scoreboard without SSE/Redis dependencies.

### Modified Capabilities
- `gamification`: Extends global challenges to support sequential multi-round scoring, streak tracking, and final challenge summary stats.

## Impact

- **UI / Views**: `web-app/src/views/room-game/ui/news-check-stage.tsx`, `round-scoreboard-stage.tsx`, and `match-scoreboard-stage.tsx` (abstracted props); new `ChallengeGameView` and `/challenge` route; `ModeCard` in `olimpo-home-page.tsx`.
- **Scripts**: `web-app/scripts/populate-challenges.ts` and `package.json` (`db:seed`).
- **DevOps / Containers**: `web-app/compose.yaml` (`seed` service).
