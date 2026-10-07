## 1. Visual Molecules and Stage Components

- [ ] 1.1 Implement `VerometroGauge` component (`src/views/room-game/ui/verometro-gauge.tsx`) matching the Stitch visual spectrum (0% to 100%), floating marker pin, and the 3 zones (Falso, Impreciso, Fato).
- [ ] 1.2 Implement `SocraticReflection` component (`src/views/room-game/ui/socratic-reflection.tsx`) with the 3 critical thinking cards (Fonte, Tom, Evidência) and fact-checking tip box.
- [ ] 1.3 Implement `NewsCheckStage` (`src/views/room-game/ui/news-check-stage.tsx`) with real article metadata, headline, image, snippet, and the 3 decision buttons ([V] Verdadeiro, [F] Falso, [?] Incerto) connected to `submitVoteAction`.
- [ ] 1.4 Implement `VerdictWaitingStage` (`src/views/room-game/ui/verdict-waiting-stage.tsx`) with floating rocket animation, user verdict vs official answer, Verômetro gauge, room progress bar, and Socratic cards.
- [ ] 1.5 Implement `RoundScoreboardStage` (`src/views/room-game/ui/round-scoreboard-stage.tsx`) with round standings, streaks, point deltas, and the host-exclusive "Avançar" button triggering `advanceRoundAction`.
- [ ] 1.6 Implement `MatchScoreboardStage` (`src/views/room-game/ui/match-scoreboard-stage.tsx`) with 3D podium (1st, 2nd, 3rd with accuracy and medals), remaining player list, and exit button.

## 2. Room Orchestrator and Real-Time Sync

- [ ] 2.1 Implement `RoomGameView` (`src/views/room-game/ui/room-game-view.tsx`) with stage state management (`CHECKING`, `WAITING`, `ROUND_SCOREBOARD`, `MATCH_FINALE`) and Server-Sent Events listener on `/api/rooms/[pin]/events` (`ROUND_STARTED`, `ROUND_COMPLETED`, `MATCH_FINISHED`).
- [ ] 2.2 Export `RoomGameView` through `src/views/room-game/index.ts`.

## 3. Room Page Integration and Validation

- [ ] 3.1 Update `src/views/room-lobby/ui/room-lobby-view.tsx` to remove the legacy redirect `router.push("/olimpo/game")` and trigger in-room game start.
- [ ] 3.2 Update `src/app/(protected)/sala/[codigo]/page.tsx` to resolve playlist articles and render `RoomGameView` when the room is active (`in_progress` or `finished`).
- [ ] 3.3 Run `pnpm typecheck` to verify complete TypeScript correctness without any compilation or layer errors.
