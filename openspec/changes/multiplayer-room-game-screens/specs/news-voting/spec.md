## ADDED Requirements

### Requirement: Four-Stage Interactive Fact-Checking Experience
The system SHALL provide an interactive four-stage game lifecycle interface in `/sala/[codigo]` reflecting real-time match progression:
1. **News Check Stage**: Displays the round's news article details and three decision options ("reliable", "unreliable", "uncertain") for participants to submit their vote.
2. **Verdict Waiting Stage**: Displays confirmation of the user's recorded vote, points awarded, the "Verômetro Olimpo" gauge reflecting AI authenticity assessment, real-time room progress, and Socratic critical thinking cards.
3. **Round Scoreboard Stage**: Displays current round rankings, streaks, and round score gains.
4. **Match Finale Stage**: Displays the final podium (1st, 2nd, 3rd) with accuracy percentages, detailed participant ranking, and exit controls.

#### Scenario: Submitting vote transitions to waiting stage
- **WHEN** a participant submits a vote on the active news article
- **THEN** the interface transitions immediately to the verdict waiting stage, rendering the participant's score breakdown and the Verômetro authenticity gauge

#### Scenario: Round completion transitions to round scoreboard
- **WHEN** all participants submit their votes or the round timer elapses and `ROUND_COMPLETED` is received
- **THEN** all participants transition to the round scoreboard stage displaying updated scores and streaks

#### Scenario: Match finish transitions to final podium
- **WHEN** the final round concludes and `MATCH_FINISHED` is received
- **THEN** all participants transition to the match finale stage displaying the 3D podium and overall rankings
