Paperclip is an open-source Node.js server and React UI that orchestrates a team of AI agents to run a business — think of it as a control plane for autonomous AI companies with org charts, budgets, governance, and goal alignment.

Main top-level directories:
- `server/` — backend API and core orchestration logic
- `ui/` — React dashboard for managing agents and tasks
- `cli/` — command-line interface for onboarding and configuration
- `packages/` — shared monorepo packages (database, plugin SDK, etc.)
- `tests/` — Playwright e2e and Vitest unit tests
- `docs/` — Mintlify documentation site