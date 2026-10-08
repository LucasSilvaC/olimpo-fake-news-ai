# Spec Delta

## Purpose

Provides a standalone single-player news challenge game mode that guides users through a sequence of news articles with immediate verification, round-by-round score progression, and a final performance scoreboard without relying on real-time multiplayer coordination.

## ADDED Requirements

### Requirement: Interactive Solo Challenge Navigation
The system SHALL allow an authenticated user to navigate to the challenge interface and retrieve a sequence of active news challenges.

#### Scenario: Accessing the challenge page with available challenges
- **WHEN** an authenticated user visits the challenge page
- **THEN** the system displays the first challenge article in the sequence, showing headline, publisher, published date, and excerpt

#### Scenario: No active challenges available
- **WHEN** an authenticated user visits the challenge page and no active challenges exist in the database
- **THEN** the system displays a clear empty-state message inviting the user to check back later

### Requirement: Standalone Challenge Vote and Progression
The system SHALL allow the user to submit an editorial classification ("reliable", "unreliable", "uncertain") for each challenge round, recording the answer and immediately showing validation, ML analysis justifications, and scoring feedback without WebSocket/SSE or room dependencies.

#### Scenario: Submitting a valid challenge vote and revealing ML analysis
- **WHEN** the user selects a classification option for the active news article
- **THEN** the system evaluates the vote against the article's target classification, records the answer, updates user XP, and transitions to the verdict stage displaying whether the answer was correct, the official classification, the Verômetro reliability score, and the model's factual justifications explaining the verdict

#### Scenario: Advancing from verdict reveal to round scoreboard
- **WHEN** the user proceeds from the verdict stage (via explicit advance action or countdown completion)
- **THEN** the system transitions to the round scoreboard displaying the player's updated score, round points delta, and active streak combo

#### Scenario: Advancing to next round or match finale
- **WHEN** the user clicks to advance from the round scoreboard
- **THEN** if further challenges remain, the system displays the next challenge round; otherwise, it transitions to the match scoreboard stage summarizing overall accuracy and total XP earned
