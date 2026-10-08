# Proposal: E2E Action Simulation Tests with Pino Logging

## Why

As the application adds Server Actions across multiple domains (authentication, room lobbies, live voting rounds, and global challenges), there is currently no unified end-to-end integration test suite simulating real client action submissions (e.g. `FormData` payload dispatching as if clicked by the user). Furthermore, test executions lack structured, step-by-step observability to verify how input data transforms into secure hashes, validates against Zod schemas, mutates database records, configures session cookies, and handles edge-case errors. Introducing this suite with Pino structured logging ensures high test confidence and clear debugging visibility across both happy and failure paths.

## What Changes

- Add `pino` and `pino-pretty` as development dependencies in `web-app`.
- Create a dedicated test logging helper (`ActionTestLogger`) that captures and pretty-prints the lifecycle stages of an action invocation:
  - `INPUT_RECEIVED`: raw inputs / FormData simulation.
  - `VALIDATION`: schema parsing success or validation errors.
  - `STATE_TRANSFORMATION`: internal domain transforms (e.g., bcrypt hashing, entity construction).
  - `PERSISTENCE`: database mutations or repository operations.
  - `SESSION_COOKIE`: cookie modifications (JWT token issuance or deletion).
  - `RESULT`: final action response payload.
- Create end-to-end action test suites covering all Server Actions with both passing and failing scenarios:
  - **Auth**: `registerAction`, `loginAction`, `logoutAction` (valid registration, email collisions, short passwords, invalid emails, valid login, wrong password, logout).
  - **Rooms**: `createRoomAction`, `joinRoomAction`, `addPlaylistNewsAction`, `startGameAction` (valid creation, unauthenticated rejection, empty name, round duration validation, invalid PIN, host permissions).
  - **News Voting**: `submitVoteAction`, `advanceRoundAction` (submitting valid vote, duplicate vote, non-existent round/room, host-only advance).
  - **Global Challenges**: `answerGlobalChallengeAction`, `listGlobalChallengesAction` (correct answer + XP award, incorrect answer, already answered, invalid vote option).
- Add npm script `test:actions` in `package.json` for running this action integration suite with Pino pretty formatting.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None.

## Impact

- **Dependencies**: Adds `pino` and `pino-pretty` to `web-app/package.json` (devDependencies).
- **Testing**: Adds dedicated action test files co-located directly inside each feature under `src/app/api/<feature>/tests/` (e.g., `auth/tests/`, `rooms/tests/`, etc.).
- **Production Code**: No production code or existing API contracts are modified or broken.
