CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  status varchar(50) NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  prerequisite_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT no_self_dep CHECK (task_id != prerequisite_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_prereq ON task_dependencies(prerequisite_task_id);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL,
  meal_name varchar(255) NOT NULL,
  protein_g real DEFAULT 0,
  fat_g real DEFAULT 0,
  carbs_g real DEFAULT 0,
  fiber_g real DEFAULT 0,
  hydration_ml real DEFAULT 0,
  micronutrients jsonb,
  logged_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nutrition_user ON nutrition_logs(user_id);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  planned_duration_minutes int NOT NULL,
  actual_duration_minutes int,
  interruption_count int DEFAULT 0,
  heart_rate_avg int,
  fatigue_score int,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_focus_user ON focus_sessions(user_id);

CREATE TABLE IF NOT EXISTS discipline_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL UNIQUE,
  score real NOT NULL DEFAULT 100,
  penalties int NOT NULL DEFAULT 0,
  last_updated timestamptz DEFAULT now() NOT NULL
);
