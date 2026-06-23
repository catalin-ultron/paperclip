import { integer, pgTable, serial, text, timestamp, numeric, boolean, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  disciplineScore: numeric("discipline_score", { precision: 10, scale: 2 }).default("100.00"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["todo", "in_progress", "complete"] }).notNull().default("todo"),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const taskDependencies = pgTable("task_dependencies", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  dependsOnTaskId: integer("depends_on_task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
});

export const nutritionEntries = pgTable("nutrition_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  calories: numeric("calories", { precision: 10, scale: 2 }).notNull(),
  proteinG: numeric("protein_g", { precision: 10, scale: 2 }).notNull().default("0"),
  fatG: numeric("fat_g", { precision: 10, scale: 2 }).notNull().default("0"),
  carbsG: numeric("carbs_g", { precision: 10, scale: 2 }).notNull().default("0"),
  micronutrients: jsonb("micronutrients").default({}),
  hydrationMl: numeric("hydration_ml", { precision: 10, scale: 2 }).default("0"),
  loggedAt: timestamp("logged_at", { mode: "date" }).defaultNow(),
});

export const focusSessions = pgTable("focus_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  taskId: integer("task_id").references(() => tasks.id),
  startedAt: timestamp("started_at", { mode: "date" }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { mode: "date" }),
  plannedDurationMinutes: integer("planned_duration_minutes").notNull(),
  interruptions: integer("interruptions").default(0),
  heartRateEstimate: integer("heart_rate_estimate"),
  fatigueEstimate: integer("fatigue_estimate"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});
