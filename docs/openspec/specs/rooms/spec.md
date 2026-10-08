# Rooms Specification

## Purpose

Provides room lifecycle management, temporary PIN code generation, participant access control, and playlist round coordination for news verification matches.

## Requirements

### Requirement: Room Creation with PIN
The system SHALL allow an authenticated user to create a game room with a unique numeric PIN code formatted as six digits separated by a space ("XXX XXX"), setting initial status to waiting and duration per round.

#### Scenario: Successfully create room
- **WHEN** a user submits a valid room creation request with room name and round duration
- **THEN** the system generates a unique PIN code, creates the room with status "waiting", and assigns the creator as "host"

#### Scenario: Reject invalid room settings
- **WHEN** a user submits a room creation request with duration less than 10 seconds or empty name
- **THEN** the system rejects the request with an appropriate validation error

### Requirement: Room Membership and Access
The system SHALL allow participants to join a room using a valid PIN code if the room is in "waiting" status.

#### Scenario: Join room with valid PIN
- **WHEN** a user provides an existing room PIN and the room is in "waiting" status
- **THEN** the system registers the user as a "participant" of the room and confirms access

#### Scenario: Reject joining an active or finished room
- **WHEN** a user attempts to join a room whose status is "in_progress" or "finished"
- **THEN** the system rejects the join request with a status conflict error

### Requirement: Room Playlist and Round Tracking
The system SHALL allow the room host to attach an ordered playlist of N news articles to the room and manage round progression.

#### Scenario: Host attaches news articles to room playlist
- **WHEN** the host submits a list of news article IDs to attach to the room
- **THEN** the system persists the ordered playlist items and updates total rounds count

#### Scenario: Host starts game from lobby
- **WHEN** the host triggers the start game action for a room with at least one participant and one playlist item
- **THEN** the system transitions room status to "in_progress", sets current round to 1, and starts round timing
