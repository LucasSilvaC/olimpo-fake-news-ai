## Purpose

Calculates participant scores per round, maintains dynamic room leaderboards, awards permanent user XP upon match completion, and scores static global training challenges.

## ADDED Requirements

### Requirement: Round Scoring and Room Leaderboard
The system SHALL award round points to participants based on vote accuracy against the article's ground truth classification and maintain an updated leaderboard for the room.

#### Scenario: Correct vote awards points
- **WHEN** a participant's vote matches the article's ground truth classification
- **THEN** the system increments the participant's room score and recalculates leaderboard rank

#### Scenario: Incorrect or uncertain vote evaluation
- **WHEN** a participant's vote does not match the ground truth classification
- **THEN** the system applies standard grading rules without awarding full accuracy points

### Requirement: Final Match XP Consolidation
The system SHALL consolidate points earned during the match into permanent user XP stored in the user profile when the room transitions to "finished".

#### Scenario: Match concludes and awards definitive XP
- **WHEN** the host finishes the final round of the room playlist
- **THEN** the system marks the room as "finished", calculates final XP awards per participant, and increments each user's global XP balance

### Requirement: Global Challenges Training
The system SHALL provide static global challenges where individual users can vote on pre-curated news articles and receive immediate XP and validation.

#### Scenario: User answers a global challenge
- **WHEN** an authenticated user answers a global challenge question
- **THEN** the system records the answer, indicates whether it was correct, and awards the corresponding training XP to the user's profile
