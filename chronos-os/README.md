# ChronosOS

High-Performance Executive Operating System. A unified, data-driven productivity engine that replaces standard to-do lists, calorie trackers, and focus timers with an integrated DAG-based task graph, biometric nutritional engine, and deep-work orchestration layer.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js 14 (App Router)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Task Graph  │  │ Lock-In UI  │  │ Nutrition Dashboard │ │
│  │ (React Flow)│  │ (WebSocket) │  │ (Macro Tracking)    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│  ┌──────┴────────────────┴─────────────────────┴──────────┐ │
│  │              Next.js API Routes (CRUD)                 │ │
│  │         Drizzle ORM  +  Row-Level Security             │ │
│  └──────┬────────────────┬─────────────────────┬──────────┘ │
└─────────┼────────────────┼─────────────────────┼────────────┘
          │                │                     │
    ┌─────┴─────┐    ┌─────┴─────┐       ┌─────┴─────┐
    │ PostgreSQL │    │  Redis    │       │  FastAPI  │
    │  (Tasks,   │    │ (Session  │       │ (Biometric│
    │ Nutrition, │    │  Locks)   │       │  Engine)  │
    │  Focus)    │    │           │       │           │
    └────────────┘    └───────────┘       └───────────┘
```

## Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS, React Flow
- **Backend**: Next.js API Routes (CRUD + auth middleware), Python FastAPI (algorithms)
- **Database**: PostgreSQL 16, Drizzle ORM
- **Cache / State**: Redis 7 (WebSocket session locks, ephemeral state)
- **CI/CD**: GitHub Actions
- **Orchestration**: Docker Compose

## Core Domains

### 1. Dependency-Aware Task Graph

Tasks are stored in a Directed Acyclic Graph (DAG). A task cannot be marked `complete` unless every upstream prerequisite is also `complete`. The frontend renders the DAG as an interactive node graph using React Flow. Edge creation is validated server-side to prevent cycles.

### 2. Biometric & Nutritional Engine (Python)

Two algorithmic endpoints run in a dedicated FastAPI container:

#### Caffeine Decay

First-order kinetics with a biological half-life of 5 hours:

```
C(t) = C0 * (0.5)^(t / t_half)
```

where `t_half = 18,000 seconds (5 hours)`.

Given a list of intake events, the API computes the remaining circulating caffeine at any query time.

#### Macro Ratio & Glucose Crash Prediction

Total macros are summed per meal log. For each planned focus block, the engine inspects the 3-hour pre-window. If carbohydrate load exceeds 80g AND the fiber-to-carb ratio falls below 0.15, the system flags a `high_crash_risk` and delays the recommended focus block by 90 minutes.

### 3. Deep Work Lock-In

When a user initiates a focus block, a WebSocket connection is established to a dedicated Lock-In server backed by Redis. The UI enters a restricted state during the active block. If the user breaks the WebSocket connection (closes the tab) before the timer expires, a server-side penalty webhook deducts 5 points from the rolling `Discipline Score` stored in PostgreSQL.

## Quick Start

### Prerequisites

- Docker + Docker Compose
- Node.js 20 + npm (for local dev outside containers)
- Python 3.12 + pip (for local dev outside containers)

### Run with Docker Compose

```bash
# Clone and enter the project
cd chronos-os

# Start all services
docker compose up --build

# Services will be available at:
# Next.js App    -> http://localhost:3000
# WebSocket      -> ws://localhost:3001
# FastAPI Docs   -> http://localhost:8000/docs
# PostgreSQL     -> localhost:5432
# Redis          -> localhost:6379
```

### Run Migrations

```bash
cd web
npm install
cp .env.example .env
npx tsx src/lib/db/migrate.ts
```

### Run Tests Locally

```bash
# Python microservice
cd python-service
pip install -r requirements.txt
pytest

# Next.js app
cd web
npm install
npm run test:ci
```

## Environment Variables

See `web/.env.example` and `python-service/Dockerfile` for required variables. The Docker Compose file injects sensible defaults for local development.

## Database Schema

### tasks
- `id` UUID PK
- `user_id` VARCHAR (RLS owner)
- `title`, `description`
- `status`: pending | in_progress | complete

### task_dependencies
- `id` UUID PK
- `task_id` -> tasks.id (the dependent task)
- `prerequisite_task_id` -> tasks.id (the blocker)
- Constraint: `task_id != prerequisite_task_id`

### nutrition_logs
- `id` UUID PK
- `user_id` VARCHAR
- `meal_name`, `protein_g`, `fat_g`, `carbs_g`, `fiber_g`, `hydration_ml`
- `micronutrients` JSONB

### focus_sessions
- `id` UUID PK
- `user_id` VARCHAR, `task_id` UUID nullable
- `started_at`, `ended_at`, `planned_duration_minutes`, `actual_duration_minutes`
- `interruption_count`, `heart_rate_avg`, `fatigue_score`

### discipline_scores
- `id` UUID PK
- `user_id` VARCHAR UNIQUE
- `score` REAL DEFAULT 100
- `penalties` INT DEFAULT 0

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/main.yml`) runs on every push and PR:

1. **test-python**: installs deps, runs PyTest with 85% coverage gate
2. **test-nextjs**: spins up Postgres + Redis services, runs migrations, runs Jest with 85% coverage gate
3. **build-docker**: builds both Docker images and runs a Docker Compose smoke test

## License

MIT
