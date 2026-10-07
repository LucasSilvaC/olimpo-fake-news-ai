# Technical Design: Multiplayer Room Game Screens

## Context

See `proposal.md` for background and motivation.
The application is built on Next.js 16 (App Router) with Tailwind CSS v4, Drizzle ORM, and Redis.
A real-time SSE stream is already implemented at `/api/rooms/[pin]/events` and subscribed to Redis channel `room:${pin}`.
The backend exposes `submitVoteAction` and `advanceRoundAction` which handle score calculation, AI feedback analysis, and room event publishing.
All prototype screens under `/olimpo/*` are discarded; all multiplayer game mechanics are centralized in `/sala/[codigo]`.

## Goals / Non-Goals

**Goals:**
- Implement the 4 reference screens from `/references` as production-ready React components with Tailwind CSS.
- Provide a zero-mock experience: news article content, user verdicts, AI Verômetro confidence, scores, streaks, and leaderboards are 100% sourced from the database and Server Actions.
- Ensure that only the room host (leader) can advance the round from the round scoreboard.
- Synchronize all connected clients in real time when the host advances via the existing SSE endpoint.
- Preserve room state on browser refresh (F5).

**Non-Goals:**
- Schema migrations or backend architectural alterations (the existing Drizzle schemas, repositories, and actions are sufficient).
- Maintaining backward compatibility with `/olimpo/*` (confirmed deprecated).

## Decisions

### 1. View Architecture under `src/views/room-game/`
Create a modular view structure:
- `room-game-view.tsx`: Main client orchestrator managing the active stage (`CHECKING`, `WAITING`, `ROUND_SCOREBOARD`, `MATCH_FINALE`), room timer, and SSE event listener.
- `news-check-stage.tsx`: Renders current article headline, publisher tag, snippet, image, and the 3 decision buttons (`reliable`, `unreliable`, `uncertain`).
- `verdict-waiting-stage.tsx`: Renders the animated floating rocket, user verdict breakdown, official answer, the Verômetro Olimpo gauge, room completion progress bar, Socratic reflection cards, and fact-checking tip.
- `round-scoreboard-stage.tsx`: Renders inter-round standings, streak highlights, round points delta (`+340 nesta`), and the host-exclusive "Avançar" button.
- `match-scoreboard-stage.tsx`: Renders the final 3D podium (1st, 2nd, 3rd) with accuracy percentages, list of other participants, and exit navigation.
- `verometro-gauge.tsx`: Standalone reusable component rendering the 0-100% authenticity gradient, floating marker pin, and 3 credibility zones.

*Alternative considered:* Separate page routes per stage (e.g., `/sala/[codigo]/votacao`, `/sala/[codigo]/placar`). Rejected to avoid unnecessary navigation latency, maintain persistent SSE connections, and prevent routing desync among players.

### 2. Room Page Integration in `/sala/[codigo]/page.tsx`
Update the page server component:
- Fetch `room`, `members`, and playlist items with resolved `newsArticles`.
- If `room.status === "waiting"`, render `RoomLobbyView`.
- If `room.status === "in_progress"` or `"finished"`, render `RoomGameView`.
- Remove the legacy `router.push("/olimpo/game")` from `RoomLobbyView`, transitioning smoothly into `RoomGameView` when `ROUND_STARTED` is triggered.

### 3. Real-Time Synchronization via Server-Sent Events
- In `RoomGameView`, open `new EventSource("/api/rooms/" + encodeURIComponent(pin) + "/events")`.
- Listen for:
  - `ROUND_STARTED`: Reset stage to `CHECKING`, update round number and active article, and start round timer.
  - `ROUND_COMPLETED`: Transition from `WAITING` to `ROUND_SCOREBOARD`, updating the leaderboard with round scores.
  - `MATCH_FINISHED`: Transition to `MATCH_FINALE`, displaying the final podium.

### 4. Leader-Only Round Advancement Contract
- On the `round-scoreboard-stage.tsx`, check `isHost = currentUserId === room.hostId`.
- Host view renders an enabled "Avançar Rodada" button that invokes `advanceRoundAction({ roomId: room.id })`.
- Non-host view renders a disabled/pulsing indicator: "Aguardando o líder da sala avançar...".
- Server-side validation in `advanceRoundUseCase` enforces `room.hostId === input.hostId`, guaranteeing security.

## Risks / Trade-offs

- **[Risk]** Temporary network drop disconnects SSE listener.
  → **Mitigation**: The browser `EventSource` automatically reconnects with exponential backoff; `RoomGameView` includes a manual refresh fallback button.
- **[Risk]** News article lacks an image or publisher name.
  → **Mitigation**: Implement graceful visual fallbacks (technical wireframe placeholder and domain extraction from article URL).
