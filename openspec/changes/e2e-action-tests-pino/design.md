# Design: E2E Action Simulation Tests with Pino Logging

## Context

Server Actions in Next.js 15/16 accept either `FormData` (dispatched from native HTML `<form action={...}>` or JavaScript `new FormData()`) or typed objects. They orchestrate Zod validation, call use cases, interact with repositories (or in-memory stores), invoke cryptographic helpers (`bcryptjs`), and set cookies via `next/headers`.

Currently, existing tests in `src/app/api/*/tests` focus on unit-level use cases with minimal action tests in `auth-actions.test.ts`. There is no structured observability of state progression (raw input -> schema parsing -> security hashing -> persistence -> session token issuance) and no end-to-end integration tests for rooms, news-voting, and global challenge actions.

## Goals / Non-Goals

**Goals:**
- Provide realistic end-to-end simulations of client action dispatches using `FormData` across all domains (`auth`, `rooms`, `news-voting`, `global-challenges`).
- Build an `ActionTestLogger` utilizing `pino` (and `pino-pretty` for human-readable terminal output during test execution).
- Trace explicit state evolutions in logs: base inputs, validation pass/fail details, security transformations (password hashing preview, token generation), database state changes, and final action response payloads.
- Cover both valid input flows and invalid edge cases (Zod schema failures, conflicts, permission denials, invalid game states).

**Non-Goals:**
- Launching heavy headless browser instances (Playwright) for this suite; execution runs directly against the action interface in Vitest for fast, deterministic feedback in CI and local dev.
- Modifying production Server Action runtime code or adding Pino to runtime production dependencies unless specified later.

## Decisions

### 1. Vitest Integration Suite with FormData Simulation
- **Decision**: Test actions by passing simulated `FormData` instances (mimicking the exact payload created by user clicks/submits on forms) in addition to typed object inputs.
- **Rationale**: Next.js Server Actions are designed to process `FormData | ActionInput`. Simulating `FormData` tests the actual deserialization and schema parsing paths.
- **Alternatives considered**: Playwright browser tests. While Playwright is in the project, it requires a fully running dev server, database migration running, and frontend UI forms wired up for all actions.

### 2. ActionTestLogger with Pino
- **Decision**: Create a shared test logger (`src/server/shared/logger/action-test-logger.ts`) configured with `pino` and `pino-pretty`, and co-locate action tests directly within each domain feature folder (`src/app/api/<feature>/tests/`).
- **Rationale**: `pino` offers structured JSON logging by default, with `pino-pretty` converting it into clean, colored terminal logs showing levels (`INFO`, `WARN`, `ERROR`), action names, and lifecycle phases.
- **Lifecycle Schema**:
  - `phase: "INPUT_RECEIVED"`: logs raw form data / object fields.
  - `phase: "VALIDATION"`: logs validation status (`passed` or `failed` with Zod issues).
  - `phase: "STATE_TRANSFORMATION"`: logs hashing, UUID creation, initial state.
  - `phase: "PERSISTENCE"`: logs database / repository write effects.
  - `phase: "SESSION_COOKIE"`: logs cookie creation/clearing.
  - `phase: "RESULT"`: logs action success status and payload.

### 3. Repository and Cookie Isolation
- **Decision**: Provide clean in-memory state or repository test harnesses reset before each test (`beforeEach`) to ensure independent, deterministic test execution.
- **Rationale**: Isolates tests from external Postgres/Redis dependencies while allowing tests to inspect internal state transitions.

### 4. News Articles JSONB Structure in Simulation Suites
- **Decision**: In action simulation suites (`rooms-actions.e2e.test.ts`, `voting-actions.e2e.test.ts`, `global-challenges-actions.e2e.test.ts`), simulate and assert `news_articles` records using the JSONB schema: `{ id, article: INewsArticle, targetClassification, createdAt }`.
- **Rationale**: Keeps integration tests and mock data strictly synchronized with the updated `news_articles` Drizzle schema, ensuring realistic persistence logs under `phase: "PERSISTENCE"` and response payload logs under `phase: "RESULT"`.

## Risks / Trade-offs

- [Risk] Verbose logs in standard CI runs.
  → Mitigation: Allow log level configuration via environment variable (e.g. `LOG_LEVEL=info` default, or `LOG_LEVEL=silent` when quiet output is desired).
- [Risk] Server action dependency on `next/headers` cookies.
  → Mitigation: Standardize cookie mocking harness in `ActionTestLogger` or test setup so all action tests reliably inspect cookie state mutations.
