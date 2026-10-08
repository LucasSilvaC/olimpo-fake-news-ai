# Tasks

## 1. Route Setup & Environment Guard

- [x] 1.1 Create `web-app/src/app/dev/sandbox/page.tsx` with `process.env.NODE_ENV === "production"` guard returning `notFound()`, delegating rendering to `DevSandboxPage`.

## 2. View Shell & Response Inspector

- [x] 2.1 Create `web-app/src/views/dev-sandbox/index.ts` exporting `DevSandboxPage`.
- [x] 2.2 Create `web-app/src/views/dev-sandbox/ui/dev-sandbox-page.tsx` providing a raw two-column layout with action cards on the left and an auto-updating JSON/status response inspector on the right.

## 3. Server Actions Form Sections

- [x] 3.1 Implement `auth-section.tsx` with inputs and buttons for `registerAction`, `loginAction`, and `logoutAction`.
- [x] 3.2 Implement `rooms-section.tsx` with inputs and buttons for `createRoomAction`, `joinRoomAction`, `startGameAction`, and `addPlaylistNewsAction`.
- [x] 3.3 Implement `voting-section.tsx` with inputs and buttons for `submitVoteAction` and `advanceRoundAction`.
- [x] 3.4 Implement `challenges-section.tsx` with inputs and buttons for `listGlobalChallengesAction` and `answerGlobalChallengeAction`.

## 4. Realtime SSE Monitoring

- [x] 4.1 Implement `sse-section.tsx` allowing input of a room PIN, connecting to `/api/rooms/[pin]/events` via `EventSource`, and displaying incoming events with timestamps.

## 5. Verification & Linting

- [x] 5.1 Run TypeScript type check (`pnpm tsc --noEmit` or equivalent) and verify zero errors in the new sandbox files.
- [x] 5.2 Validate OpenSpec change status using `openspec validate --change dev-actions-sandbox`.
