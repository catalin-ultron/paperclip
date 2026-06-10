Paperclip is an open-source Node.js server and React UI that orchestrates teams of AI agents to run autonomous companies — with org charts, goals, budgets, and governance.

Main top-level directories: `packages/` (shared libs), `ui/` (React dashboard), `server/` (API backend), `cli/` (onboarding CLI), `tests/` (e2e + unit), `docs/` / `doc/` (docs + assets), `docker/` (container setup), and `skills/` (agent skill definitions).

Built as a pnpm monorepo with TypeScript, PostgreSQL, and a plugin system for extending without forking.
