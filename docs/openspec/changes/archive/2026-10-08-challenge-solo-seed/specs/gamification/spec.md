# Spec Delta

## MODIFIED Requirements

### Requirement: Global Challenges Training
The system SHALL provide static global challenges where individual users can vote on pre-curated news articles and receive immediate XP and validation, tracking challenge answer records per user.

#### Scenario: User answers a global challenge
- **WHEN** an authenticated user answers a global challenge question
- **THEN** the system records the answer, indicates whether it was correct, and awards the corresponding training XP to the user's profile

#### Scenario: User queries challenges with completed status
- **WHEN** an authenticated user lists active global challenges
- **THEN** the system indicates for each challenge whether the user has already submitted an answer, their chosen classification, and the XP awarded
