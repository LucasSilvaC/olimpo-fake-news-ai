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
