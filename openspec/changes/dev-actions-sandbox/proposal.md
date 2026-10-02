# Proposal: Developer Sandbox for Server Actions and Realtime API Testing

## Why

Currently, manual testing and verification of backend Server Actions (Authentication, Rooms, Voting, Gamification) and Realtime Server-Sent Events (SSE) require either writing end-to-end test suites or clicking through complex, in-progress UI flows. Developers need a lightweight, dedicated, raw test harness interface in the browser to trigger actions, inspect request/response payloads in real time, and monitor live SSE event streams during local development without depending on finished design components.

## What Changes

- Add a development-only test harness route at `/dev/sandbox` (`src/app/dev/sandbox/page.tsx`) guarded against production environments.
- Create a dedicated View slice in `src/views/dev-sandbox/` adhering to the project's Feature-Sliced Design (FSD) architecture.
- Implement raw, simple forms with inputs and trigger buttons for core Server Actions:
  - **Auth**: `registerAction`, `loginAction`, `logoutAction`
  - **Rooms**: `createRoomAction`, `joinRoomAction`, `startGameAction`, `addPlaylistNewsAction`
  - **News Voting**: `submitVoteAction`, `advanceRoundAction`
  - **Gamification / Global Challenges**: `listGlobalChallengesAction`, `answerGlobalChallengeAction`
- Implement an SSE event listener console connecting to `/api/rooms/[pin]/events` to stream room events in real time.
- Provide a persistent raw JSON output inspector panel displaying formatted action responses and errors.

## Capabilities

### New Capabilities
- `dev-sandbox`: Interactive browser-based developer harness for executing server actions, testing SSE streams, and inspecting real-time responses.

### Modified Capabilities
*(None - existing core capabilities and business rules remain unchanged.)*

## Impact

- **Affected Code**: Adds `web-app/src/app/dev/sandbox/page.tsx` and `web-app/src/views/dev-sandbox/**`.
- **Dependencies & APIs**: Invokes existing server actions and connects to existing `/api/rooms/[pin]/events` SSE route. No third-party dependencies required.
- **Environment**: Secured to return 404 or be disabled when `NODE_ENV === 'production'`.
