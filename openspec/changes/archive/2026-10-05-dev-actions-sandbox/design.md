# Design: Developer Sandbox

## Context

The web app is built with Next.js (App Router) adhering to Feature-Sliced Design (FSD). In FSD, `src/app/**/page.tsx` routes act strictly as thin entry points, delegating UI rendering to `src/views/**`. Core business interactions are modeled through Next.js Server Actions (marked `"use server"`) in `src/app/api/**/actions/` and Server-Sent Events via `src/app/api/rooms/[pin]/events/route.ts`.

See `proposal.md` for motivation and requirements.

## Goals / Non-Goals

**Goals:**
- Provide a clear, zero-dependency, developer-only test harness to trigger all key server actions directly.
- Maintain strict alignment with the project's FSD structure (`src/views/dev-sandbox` and `src/app/dev/sandbox/page.tsx`).
- Display live structured JSON responses, execution durations, and error messages.
- Allow connecting, listening to, and disconnecting from SSE room events in real time.
- Ensure the route is automatically disabled in production.

**Non-Goals:**
- Heavy styling, fancy animations, or production-grade design system polish (keep it simple, clean, and utilitarian).
- Comprehensive automated test runner replacement (this is an interactive manual dev harness).
- Testing internal health checks (`/api/health`) or standalone scraping endpoints (`/api/news/extract`).

## Decisions

### 1. FSD View Organization
- **Decision**: Create `src/views/dev-sandbox/` containing:
  - `index.ts`: Public export of the view (`DevSandboxPage`).
  - `ui/dev-sandbox-page.tsx`: Two-column layout orchestrating action sections and the inspector log panel.
  - `ui/sections/`: Modular form cards for `auth-section.tsx`, `rooms-section.tsx`, `voting-section.tsx`, `challenges-section.tsx`, and `sse-section.tsx`.
- **Alternative considered**: Putting everything directly in `src/app/dev/sandbox/page.tsx`. Rejected because the project explicitly requires routing delegation to `src/views/**` per FSD rules.

### 2. State & Client-Side Action Invocation
- **Decision**: The view component will run as a Client Component (`"use client"`) using standard React `useState` / `useTransition` to call imported server actions asynchronously and capture their return values or errors.
- **Alternative considered**: Pure HTML form POST submissions. Rejected because client action invocations preserve page state, allow non-reloading submission, and enable immediate JSON inspection.

### 3. Production Guard
- **Decision**: Guard the entry point in `src/app/dev/sandbox/page.tsx`:
  ```tsx
  import { notFound } from "next/navigation";
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  ```
- **Rationale**: Prevents accidental exposure of administrative/test harness tooling in production deployments.

### 4. Realtime SSE Monitor
- **Decision**: Use the browser's native `EventSource` API targeting `/api/rooms/${pin}/events`, appending received events to a chronological list with timestamp and event name.
- **Alternative considered**: Third-party WebSocket or EventSource polyfills. Native `EventSource` is built-in and already supported by modern browsers.

## Risks / Trade-offs

- **[Session Dependency]** Actions like `createRoomAction` require an active user session.
  - *Mitigation*: The harness includes an Auth section right at the top so developers can register or log in first, establishing the session cookie before calling room actions.
- **[Dev route leakage]** Risk of leaving dev routes accessible.
  - *Mitigation*: Enforce `notFound()` in production environments in `page.tsx`.
