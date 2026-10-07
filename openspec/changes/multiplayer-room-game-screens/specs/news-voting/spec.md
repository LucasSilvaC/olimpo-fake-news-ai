## ADDED Requirements

### Requirement: Four-Stage Interactive Fact-Checking Experience
The system SHALL provide an interactive four-stage game lifecycle interface in `/sala/[codigo]` reflecting real-time match progression:
1. **News Check Stage**: Displays the round's news article details and three decision options ("reliable", "unreliable", "uncertain") for participants to submit their vote within the configured round duration.
2. **Verdict Waiting Stage**: Displays confirmation of the user's recorded vote, points awarded, the "Verômetro Olimpo" gauge reflecting AI authenticity assessment, real-time room progress, Socratic critical thinking cards, and prominent AI justification arguments (`reasons`) upon round completion with a synchronized reading countdown.
3. **Round Scoreboard Stage**: Displays current round rankings, streaks, and round score gains.
4. **Match Finale Stage**: Displays the final podium (1st, 2nd, 3rd) with accuracy percentages, detailed participant ranking, and exit controls.

#### Scenario: Submitting vote transitions to waiting stage
- **WHEN** a participant submits a vote on the active news article
- **THEN** the interface transitions immediately to the verdict waiting stage, rendering the participant's score breakdown and the Verômetro authenticity gauge

#### Scenario: Round duration elapses force concludes round
- **WHEN** the round timer elapses (`timeRemaining <= 0`) before all participants submit their votes manually
- **THEN** any pending participant's vote is auto-submitted or recorded as a timeout vote (`"uncertain"` with 0 points awarded), the round is force-concluded atomically, and `ROUND_COMPLETED` is broadcasted

#### Scenario: Round completion reveals verdict with reading countdown
- **WHEN** `ROUND_COMPLETED` is received
- **THEN** all participants remain in or transition to the verdict waiting stage for an adequate reading period (10-second visible countdown with optional skip action), displaying the official answer, Verômetro gauge, and prominent AI explanation arguments (`reasons`) before transitioning to the round scoreboard stage

#### Scenario: Match finish transitions to final podium
- **WHEN** the final round concludes and `MATCH_FINISHED` is received
- **THEN** all participants transition to the match finale stage displaying the 3D podium and overall rankings
