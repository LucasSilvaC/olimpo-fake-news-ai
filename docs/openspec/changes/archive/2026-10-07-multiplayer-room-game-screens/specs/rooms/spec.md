## ADDED Requirements

### Requirement: Synchronized In-Game Round Advancement by Room Host
The system SHALL ensure that within `/sala/[codigo]`, only the room host is authorized to advance the round from the round scoreboard. Upon host advancement, the system SHALL broadcast a real-time event to synchronize all connected participants into the subsequent round or the final match scoreboard without requiring manual page navigation.

#### Scenario: Host advances the round
- **WHEN** the room host triggers round advancement while in the round scoreboard
- **THEN** the system advances the room's current round, publishes `ROUND_STARTED` via Server-Sent Events, and all connected participants transition synchronously to the next news article

#### Scenario: Participant cannot advance the round
- **WHEN** a non-host participant views the round scoreboard
- **THEN** the advance button is disabled or hidden, displaying a waiting status indicator until the host advances

#### Scenario: Final round completion triggers match finale
- **WHEN** the room host triggers advancement on the final round of the playlist
- **THEN** the system transitions the room status to "finished", consolidates final scores, publishes `MATCH_FINISHED`, and all participants transition to the match podium scoreboard
