# Design

## Context

The repository provides robust database schemas (`global_challenges`, `global_challenge_answers`, `news_articles`), business logic use cases (`ListGlobalChallengesUseCase`, `AnswerGlobalChallengeUseCase`), and rich UI stage components (`NewsCheckStage`, `RoundScoreboardStage`, `MatchScoreboardStage`). However, these stage components were originally coupled to multiplayer rooms (calling room actions and synchronizing via Redis SSE streams).

See `proposal.md` for overall motivation.

## Goals / Non-Goals

**Goals:**
- Provide a responsive, instant solo challenge experience with zero WebSocket/SSE/Redis overhead.
- Decouple existing room game UI stages so they are cleanly reusable across multiplayer and single-player modes without UI code duplication.
- Create an automated, idempotent seed script that extracts 10 real G1 news articles via `extractNews` and populates `news_articles` and `global_challenges` with mocked `MLTargetType` classifications.
- Enable automatic seeding on `docker compose up` via a dedicated Compose service.

**Non-Goals:**
- Multiplayer room matchmaking or timer sync for solo challenges.
- Live ML model inference during seeding (the target classification is deliberately mocked to ensure testability and gameplay balance).

## Decisions

### 1. View Abstraction via Optional Handlers
- **Decision**: In `NewsCheckStage`, add an optional prop `onCustomVote?: (choice: VoteOptionType) => Promise<SubmitVoteActionResult>`. When provided, `NewsCheckStage` invokes this handler instead of dispatching `submitVoteAction` with `roomId`. In `RoundScoreboardStage`, make `roomId` optional when `onAdvance` is provided.
- **Alternatives Considered**: 
  - *Duplicate stage components specifically for solo mode*: Rejected because it would cause code duplication and drift between multiplayer and solo styling.
  - *Fake room creation for solo players*: Rejected because it introduces unnecessary database entities, Redis connections, and latency.

### 2. Client-Side Solo Game Engine (`ChallengeGameView`)
- **Decision**: Implement `ChallengeGameView` as a client component managing a local state machine (`CHECKING` -> `WAITING` -> `ROUND_SCOREBOARD` -> `CHECKING` ... -> `MATCH_FINALE`). 
- **Transitions**:
  1. On vote: Dispatches `answerGlobalChallengeAction({ challengeId, answer })`.
  2. Immediate verdict feedback (`WAITING` stage): Renders `VerdictWaitingStage` presenting the user's vote alongside the official classification, an explicit correct/incorrect evaluation, the Verômetro reliability score gauge, and the model's factual justifications explaining the verdict.
  3. On proceed: Transitions to `RoundScoreboardStage` displaying points earned (+50 XP), streak bonus, and session standings.
  4. On advance: If `currentRound < totalChallenges`, increments round and returns to `NewsCheckStage`. Otherwise, transitions to `MatchScoreboardStage` presenting accuracy and total XP.
- **Alternatives Considered**: Full server-side page navigation per round. Rejected because client state transition provides instant feedback and avoids re-fetching unchanged assets.

### 3. Population Script Architecture (`populate-challenges.ts`)
- **Decision**: Place the script in `web-app/scripts/populate-challenges.ts` and bind it to `pnpm db:seed` in `package.json`. The script defines 10 real G1 news URLs across varied domains (science, technology, health, economy, politics). For each URL, it checks if an article already exists (idempotency), calls `extractNews(url)`, maps a mocked `targetClassification` (`reliable`, `unreliable`, `uncertain`), and inserts into `news_articles` and `global_challenges`.
- **Resilience**: Wrap each extraction in a try/catch with fallback sample data if external network access is blocked in restricted environments, preventing container startup failures.

### 4. Docker Compose Orchestration
- **Decision**: In `web-app/compose.yaml`, add a `seed` service reusing the `migrator` build target with command `["pnpm", "db:seed"]`. It depends on `migrate: condition: service_completed_successfully`, and `app` depends on `seed: condition: service_completed_successfully`.
- **Alternatives Considered**: Running seed inside the `migrate` container command (`pnpm db:migrate && pnpm db:seed`). Kept separate in Compose so migrations and seeding maintain distinct logs and responsibilities.

## Risks / Trade-offs

- **[Risk] External G1 URLs may experience network delays or transient errors during Docker build/up** → *Mitigation*: Script uses a reasonable per-request timeout and includes resilient fallback article structures if a URL is unreachable.
- **[Risk] User re-playing already answered challenges** → *Mitigation*: When listing challenges, `listGlobalChallengesAction` indicates answered status; in `ChallengeGameView`, users can review answered questions or practice with uncompleted ones.
