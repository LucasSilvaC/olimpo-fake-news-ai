# Contributing

Use a lowercase kebab-case branch: `feat/<short-description>`, `fix/<short-description>`, or `chore/<short-description>`. Changes require a pull request and review before merge.

Before opening a PR, run `pnpm check`. Commits follow `type(scope): description`, entirely in lowercase. Never commit secrets. Prefer small, focused changes, add meaningful tests, and include versioned Drizzle migrations for schema changes. The author owns verifying migration safety and rollback.
