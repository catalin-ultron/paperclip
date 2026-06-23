# ChronosOS Build Plan

## Objective
Build a High-Performance Executive Operating System — unified productivity engine replacing to-do lists, calorie trackers, and focus timers.

## Tech Stack
- Frontend: Next.js 14 (App Router), React, TypeScript, TailwindCSS, React Flow
- Backend: Next.js API Routes + Python FastAPI microservice
- Database: PostgreSQL via Docker Compose, Drizzle ORM
- Caching/State: Redis (WebSocket state, session locking)
- CI/CD: GitHub Actions

## Steps

### Step 1: Infrastructure & Database
- [x] docker-compose.yml (Postgres, Redis, FastAPI, Next.js)
- [ ] Initialize Next.js TypeScript project in /web
- [ ] Configure Drizzle ORM
- [ ] Write SQL schema: Tasks (DAG), Nutrition, Focus Sessions
- [ ] Write migration files
- [ ] Implement API-layer RLS equivalents

### Step 2: Task Graph
- [ ] API endpoints: CRUD tasks
- [ ] DAG validation: cannot complete task unless upstream deps are complete
- [ ] React Flow component for interactive node-based graph

### Step 3: Python Microservice
- [ ] FastAPI setup with Dockerfile
- [ ] Caffeine Decay Algorithm (half-life t1/2 = 5h)
- [ ] Macro Ratio Calculator with glucose crash prediction
- [ ] Focus Block schedule adjustment

### Step 4: Deep Work Orchestration
- [ ] Lock-In dashboard
- [ ] WebSocket via Redis for Deep Work Blocks
- [ ] Restricted UI state during active block
- [ ] Penalty webhook: deduct Discipline Score on premature disconnect

### Step 5: CI/CD & Finalization
- [ ] Jest tests for DAG validation
- [ ] PyTest for decay algorithms
- [ ] .github/workflows/main.yml (Docker spin-up, migrations, tests, 85% coverage gate)
- [ ] README.md with architecture, formulas, and run instructions
