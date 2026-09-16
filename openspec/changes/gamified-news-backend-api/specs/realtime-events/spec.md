## Purpose

Delivers real-time state change notifications to room participants using Server-Sent Events (SSE) backed by a Redis publish/subscribe message channel.

## ADDED Requirements

### Requirement: Room Event Streaming via SSE
The system SHALL expose an HTTP Server-Sent Events endpoint (`GET /api/rooms/[pin]/events`) that streams real-time room events to connected participants.

#### Scenario: Participant connects to room event stream
- **WHEN** a client initiates an SSE connection to a valid room PIN
- **THEN** the system keeps an HTTP streaming response open with "text/event-stream" content type and transmits room events as they occur

#### Scenario: Client disconnect cleans up subscription
- **WHEN** a client terminates or aborts the SSE connection
- **THEN** the system automatically unbinds the Redis listener and cleans up connection resources

### Requirement: Real-time Event Publishing
The system SHALL publish structured domain events to the room channel whenever mutations occur via Server Actions.

#### Scenario: Member joined event published
- **WHEN** a new participant successfully joins the room via a Server Action
- **THEN** the system publishes a "MEMBER_JOINED" event containing the updated member list

#### Scenario: Round finished event published
- **WHEN** all participants submit their votes or round timer expires
- **THEN** the system publishes a "ROUND_COMPLETED" event with round scores and AI feedback
