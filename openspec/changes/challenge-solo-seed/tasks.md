# Tasks

## 1. G1 News Populate Script and Docker Compose Integration

- [x] 1.1 Implement `scripts/populate-challenges.ts` defining 10 real G1 news URLs, extracting content via `extractNews`, assigning mocked `targetClassification` (`reliable`, `unreliable`, `uncertain`), and saving records idempotently to `news_articles` and `global_challenges`.
- [x] 1.2 Update `web-app/package.json` to point `"db:seed"` to `"tsx scripts/populate-challenges.ts"`.
- [x] 1.3 Update `web-app/compose.yaml` to add the `seed` service that executes `pnpm db:seed` after `migrate` completes successfully, and configure `app` to depend on `seed`.

## 2. Decouple Game Stage Views for Solo Play

- [x] 2.1 Update `NewsCheckStage` (`src/views/room-game/ui/news-check-stage.tsx`) to accept an optional `onCustomVote` callback and make `roomId` optional when custom voting is used.
- [x] 2.2 Update `RoundScoreboardStage` (`src/views/room-game/ui/round-scoreboard-stage.tsx`) to make `roomId` optional when `onAdvance` is provided.
- [x] 2.3 Verify that `MatchScoreboardStage` operates cleanly with single-player summary statistics without room context.

## 3. Solo Challenge Game View and Route Integration

- [ ] 3.1 Implement `ChallengeGameView` in `src/views/challenge/ui/challenge-game-view.tsx` managing the solo round lifecycle (Voting -> Round Scoreboard -> Next Round / Match Scoreboard) and dispatching `answerGlobalChallengeAction`.
- [ ] 3.2 Implement the protected Next.js App Router page in `src/app/(protected)/challenge/page.tsx` that fetches active challenges via `listGlobalChallengesAction` and renders `ChallengeGameView`.
- [ ] 3.3 Update `ModeCard` and `OlimpoHomePage` (`src/views/olimpo/home/ui/olimpo-home-page.tsx`) so that the "Fazer desafios" card links to `/challenge`.

## 4. Verification and Quality Checks

- [ ] 4.1 Implement unit test for the populate script asserting extraction error resilience, idempotency, and classification distribution.
- [ ] 4.2 Execute `pnpm check` in `web-app` (format, lint, typecheck, tests) and verify the entire build passes without errors.
