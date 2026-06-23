# ChronosOS

High-Performance Executive Operating System. A unified, data-driven productivity engine that replaces scattered to-do lists, calorie trackers, and focus timers with a single DAG-based task graph, biometric nutritional engine, and deep-work orchestration layer.

## Architecture

```
Browser
  |
  v
Next.js 14 (App Router) --- API Routes --- PostgreSQL
  |                                    |
  |                                    +-- Redis
  |                                         (sessions, SSE pub/sub)
  v
Python FastAPI Microservice
  (caffeine decay, macro-crash-risk algorithms)
```

## Quick Start

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Python API: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| DATABASE_URL | `postgresql://chronos:chronos_secret@localhost:5432/chronosos` | Postgres connection string |
| REDIS_URL | `redis://localhost:6379` | Redis connection string |
| PYTHON_SERVICE_URL | `http://python-service:8000` | Internal FastAPI URL |
| NEXTAUTH_SECRET | `super-secret-key-change-in-production` | JWT signing secret |

## Database Schema

### Tasks (DAG)
- `tasks` table: title, description, status (`todo` | `in_progress` | `complete`), priority, timestamps.
- `task_dependencies` table: `task_id` → `depends_on_task_id` with cycle prevention.

### Nutrition
- `nutrition_entries`: name, calories, protein_g, fat_g, carbs_g, micronutrients (JSONB), hydration_ml, logged_at.

### Focus Sessions
- `focus_sessions`: task_id, started_at, ended_at, planned_duration_minutes, interruptions, heart_rate_estimate, fatigue_estimate, completed.

## Core Algorithms

### Caffeine Decay
```
C(t) = C0 * 0.5 ^ (t / 5)
```
- `C0`: initial amount (mg)
- `t`: elapsed time in hours
- Half-life `t1/2 = 5` hours

### Macro Crash Risk
```
carb_ratio = (carbs_g * 4) / total_calories
if carb_ratio > 0.55:
    high_carb_crash_risk = True
    shift focus blocks 60 minutes earlier
```

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/tasks` | GET, POST | List / create tasks |
| `/api/tasks/:id` | GET, PATCH, DELETE | Read / update / delete task |
| `/api/nutrition` | GET, POST | List / log nutrition |
| `/api/focus` | GET, POST | List / start focus session |
| `/api/focus/:id` | PATCH | End / update session |
| `/api/sessions/stream` | GET | SSE heartbeat for active session |
| `/api/sessions/penalty` | POST | Apply discipline penalty |
| `/health` | GET | Python service health |
| `/caffeine/decay` | POST | Caffeine half-life calculation |
| `/nutrition/macro-warning` | POST | Macro ratio crash-risk analysis |

## Testing

```bash
# Frontend (Jest)
cd frontend
npx jest --coverage

# Python (PyTest)
cd python-service
pytest --cov=main --cov-report=term-missing
```

CI/CD enforces 85% code coverage for both frontend and Python via GitHub Actions.
