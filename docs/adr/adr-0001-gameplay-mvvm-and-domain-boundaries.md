---
title: "ADR-0001: Gameplay MVVM and domain boundaries"
status: "Accepted"
date: "2026-10-17"
authors: "Codex, senior architecture pass"
tags: ["architecture", "mvvm", "ddd", "fsd"]
supersedes: ""
superseded_by: ""
---

# ADR-0001: Gameplay MVVM and domain boundaries

## Status

Accepted

## Context

The multiplayer lobby, room game and solo challenge views currently own state, effects, server actions, DTO mapping and rendering. Shared stage components are imported through the private implementation path of the room-game view. The frontend also recalculates vote results that are already returned by the server.

In the server contexts for rooms, news voting and global challenges, domain files depend on database schema types, repository contracts expose persistence rows, application use cases instantiate concrete adapters, and the global-challenges context imports a value object from news-voting. These dependencies make changes cross layer and cross context.

The application uses the Next.js App Router. `src/pages` is a recognized legacy Pages Router convention, so the existing `src/views` layer remains the project’s page composition layer and is mapped explicitly to FSD `pages` in project documentation.

## Decision

Keep page composition in `views/`, move gameplay state/orchestration into feature-local ViewModels, publish reused game stages from an explicit slice API, and keep domain/application contracts independent of persistence adapters.

Use one small shared classification value object for the stable `reliable | uncertain | unreliable` vocabulary. Scoring, aggregate behavior and persistence remain owned by their bounded contexts; no aggregate class is shared.

## Consequences

### Positive

- **POS-001**: Gameplay views become presentation-focused and localize state and side effects in ViewModels.
- **POS-002**: Shared stage components have one public import path and no longer depend on a sibling view’s private files.
- **POS-003**: Server results remain the single source for score and correctness.
- **POS-004**: Domain tests can run without Drizzle schema types or database adapters.
- **POS-005**: The project keeps App Router routing behavior while documenting how `views/` maps to FSD `pages`.

### Negative

- **NEG-001**: ViewModels and ports add files and concepts that contributors must learn.
- **NEG-002**: Repository adapters need explicit mapping code between Drizzle records and domain/read models.
- **NEG-003**: The shared classification vocabulary needs coordinated changes if the product later gives contexts different terms.

## Alternatives Considered

### Keep orchestration in the views

- **ALT-001**: **Description**: Keep current state, effects and actions in the three large views.
- **ALT-002**: **Rejection reason**: It violates the project’s MVVM rule and keeps gameplay changes spread across rendering and orchestration.

### Move the page layer to `src/pages`

- **ALT-003**: **Description**: Rename `views/` to the standard FSD layer name `pages/`.
- **ALT-004**: **Rejection reason**: Next.js recognizes `src/pages` as a legacy router directory; retaining `views/` avoids introducing a second routing system.

### Share all game domain models between bounded contexts

- **ALT-005**: **Description**: Put room votes and challenge answers behind one shared game aggregate.
- **ALT-006**: **Rejection reason**: Room scoring and solo XP have different invariants and lifecycles; only the stable classification vocabulary is shared.

### Do nothing

- **ALT-007**: **Description**: Retain existing view and adapter dependencies.
- **ALT-008**: **Rejection reason**: The current dependency direction and client-side scoring already cause duplicated rules and broad change surfaces.

## Implementation Notes

- **IMP-001**: Preserve current route, UI and Server Action contracts.
- **IMP-002**: Wire concrete adapters from composition roots; keep them out of use-case modules.
- **IMP-003**: Ensure every server path that completes a round emits explicit `roundDelta` and `isCorrect` before requiring those fields in the client contract.
- **IMP-004**: Validate view behavior, domain mapping, lint, typecheck, unit tests and production build.

## References

- **REF-001**: [OpenSpec proposal](../openspec/changes/gameplay-architecture-refactor/proposal.md)
- **REF-002**: [OpenSpec design](../openspec/changes/gameplay-architecture-refactor/design.md)
- **REF-003**: [Next.js project structure guide](https://nextjs.org/docs/app/getting-started/project-structure)
