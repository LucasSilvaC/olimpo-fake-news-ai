# Tasks: E2E Action Simulation Tests with Pino Logging

## 1. Dependencies and Logging Infrastructure

- [x] 1.1 Install `pino` and `pino-pretty` as devDependencies in `web-app` and verify installation succeeds with `pnpm --filter web-app list`
- [x] 1.2 Implement `ActionTestLogger` in `src/server/shared/logger/action-test-logger.ts` supporting lifecycle events (`INPUT_RECEIVED`, `VALIDATION`, `STATE_TRANSFORMATION`, `PERSISTENCE`, `SESSION_COOKIE`, `RESULT`) and verify with a quick helper test

## 2. Auth Actions E2E Test Suite

- [x] 2.1 Implement `src/app/api/auth/tests/auth-actions.e2e.test.ts` for `registerAction` simulating `FormData` submissions (valid user, duplicate email conflict, invalid email format, short password) with Pino state logs and verify tests pass with `pnpm --filter web-app test:unit src/app/api/auth/tests/auth-actions.e2e.test.ts`
- [x] 2.2 Extend `auth-actions.e2e.test.ts` to cover `loginAction` and `logoutAction` (valid credentials with JWT cookie set, invalid password, missing user, logout cookie cleared) with Pino state logs and verify tests pass

## 3. Rooms Actions E2E Test Suite

- [ ] 3.1 Implement `src/app/api/rooms/tests/rooms-actions.e2e.test.ts` for `createRoomAction` and `joinRoomAction` (valid room creation with PIN, round duration constraints, unauthenticated session rejection, invalid room PIN) with Pino logs and verify tests pass with `pnpm --filter web-app test:unit src/app/api/rooms/tests/rooms-actions.e2e.test.ts`
- [ ] 3.2 Extend `rooms-actions.e2e.test.ts` to cover `addPlaylistNewsAction` and `startGameAction` (adding articles to room playlist with parsed `article` JSONB persistence, host-only game start, unauthorized player rejection) with Pino state logs and verify tests pass

## 4. Voting & Global Challenges Actions E2E Test Suite

- [ ] 4.1 Implement `src/app/api/news-voting/tests/voting-actions.e2e.test.ts` covering `submitVoteAction` and `advanceRoundAction` (submitting valid vote, duplicate vote rejection, host advance round) with Pino logs and verify tests pass with `pnpm --filter web-app test:unit src/app/api/news-voting/tests/voting-actions.e2e.test.ts`
- [ ] 4.2 Implement `src/app/api/global-challenges/tests/global-challenges-actions.e2e.test.ts` covering `listGlobalChallengesAction` and `answerGlobalChallengeAction` (listing active challenges asserting `article` JSONB structure, correct answer with XP award, incorrect answer, already answered rejection) with Pino logs and verify tests pass with `pnpm --filter web-app test:unit src/app/api/global-challenges/tests/global-challenges-actions.e2e.test.ts`

## 5. Verification & Script Integration

- [ ] 5.1 Add `"test:actions": "vitest run src/app/api/**/tests/*.e2e.test.ts"` to `web-app/package.json` and execute `pnpm --filter web-app test:actions` to verify all action test suites execute and pass with formatted Pino logs
