# Spec Delta: Developer Sandbox

## Purpose

Provides a lightweight, interactive developer test harness in the browser for triggering backend server actions, monitoring SSE realtime events, and inspecting responses during local development.

## ADDED Requirements

### Requirement: Developer sandbox route availability
The application SHALL provide a dedicated route at `/dev/sandbox` accessible only in non-production environments.

#### Scenario: Accessing sandbox in development
- **WHEN** a user visits `/dev/sandbox` in a development environment
- **THEN** the test harness interface is displayed with forms for testing server actions and SSE events

#### Scenario: Accessing sandbox in production
- **WHEN** a user visits `/dev/sandbox` in a production environment
- **THEN** the application returns a 404 Not Found response

### Requirement: Interactive server actions testing
The interface SHALL provide separate, raw input forms and trigger buttons for authentication, rooms, voting, and global challenge server actions.

#### Scenario: Triggering an action with valid inputs
- **WHEN** the user inputs required fields and clicks the action trigger button
- **THEN** the system executes the corresponding server action and renders the formatted JSON response and status in the log panel

#### Scenario: Triggering an action resulting in an error
- **WHEN** the user triggers an action that fails validation or rejects on the server
- **THEN** the system renders the error message and failed status clearly in the log panel

### Requirement: Realtime SSE event monitoring
The interface SHALL allow connecting to a room's Server-Sent Events stream using a room PIN.

#### Scenario: Connecting to room SSE stream
- **WHEN** the user enters a valid room PIN and clicks "Connect SSE"
- **THEN** an EventSource connection is established to `/api/rooms/[pin]/events` and incoming events are appended chronologically to the event log

#### Scenario: Disconnecting from room SSE stream
- **WHEN** the user clicks "Disconnect SSE"
- **THEN** the EventSource connection is closed and no further events are logged until reconnected
