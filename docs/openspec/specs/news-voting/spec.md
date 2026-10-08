# News Voting Specification

## Purpose

Manages the participant voting lifecycle per news article round across three credibility tiers ('reliable', 'uncertain', 'unreliable') and evaluates round completion conditions.

## Requirements

### Requirement: Participant Round Voting
The system SHALL accept a vote from a registered room participant for the active round's news article, strictly validating one of the three options: "reliable", "uncertain", or "unreliable".

#### Scenario: Participant submits valid vote
- **WHEN** an active room participant submits a vote option ("reliable", "uncertain", or "unreliable") for the current round
- **THEN** the system records the vote, associates it with the participant and round, and confirms submission

#### Scenario: Prevent duplicate votes in the same round
- **WHEN** a participant who has already voted in the current round attempts to submit another vote
- **THEN** the system rejects the second vote with a duplicate vote error

#### Scenario: Reject vote outside active round
- **WHEN** a user submits a vote for a room that is not currently in "in_progress" status or for a round that has already concluded
- **THEN** the system rejects the vote submission

### Requirement: Round Completion Detection
The system SHALL automatically detect when all active participants of the room have submitted their votes for the current round or when the round duration expires.

#### Scenario: All participants have voted
- **WHEN** the last pending participant in the room submits their vote for the active round
- **THEN** the system marks the round as completed, evaluates scores, and triggers the AI analysis reveal

#### Scenario: Round duration expires
- **WHEN** the round duration expires before all participants have submitted votes
- **THEN** the system marks pending participants as timed-out (neutral vote with 0 points awarded), concludes the round atomically, and triggers the AI analysis reveal

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
