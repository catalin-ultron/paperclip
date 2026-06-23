CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "discipline_score" NUMERIC(10,2) DEFAULT 100.00,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'todo',
  "priority" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "task_dependencies" (
  "id" SERIAL PRIMARY KEY,
  "task_id" INTEGER NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  "depends_on_task_id" INTEGER NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  CONSTRAINT no_self_dep CHECK ("task_id" <> "depends_on_task_id"),
  UNIQUE("task_id", "depends_on_task_id")
);

CREATE TABLE IF NOT EXISTS "nutrition_entries" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "name" TEXT NOT NULL,
  "calories" NUMERIC(10,2) NOT NULL,
  "protein_g" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "fat_g" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "carbs_g" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "micronutrients" JSONB DEFAULT '{}',
  "hydration_ml" NUMERIC(10,2) DEFAULT 0,
  "logged_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "focus_sessions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "task_id" INTEGER REFERENCES "tasks"("id"),
  "started_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ended_at" TIMESTAMP,
  "planned_duration_minutes" INTEGER NOT NULL,
  "interruptions" INTEGER DEFAULT 0,
  "heart_rate_estimate" INTEGER,
  "fatigue_estimate" INTEGER,
  "completed" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON "tasks"("user_id");
CREATE INDEX IF NOT EXISTS idx_nutrition_user ON "nutrition_entries"("user_id");
CREATE INDEX IF NOT EXISTS idx_focus_user ON "focus_sessions"("user_id");
