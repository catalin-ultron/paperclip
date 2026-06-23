import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, real, boolean } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const taskDependencies = pgTable("task_dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  prerequisiteTaskId: uuid("prerequisite_task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const nutritionLogs = pgTable("nutrition_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  mealName: varchar("meal_name", { length: 255 }).notNull(),
  proteinG: real("protein_g").default(0),
  fatG: real("fat_g").default(0),
  carbsG: real("carbs_g").default(0),
  fiberG: real("fiber_g").default(0),
  hydrationMl: real("hydration_ml").default(0),
  micronutrients: jsonb("micronutrients"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
});

export const focusSessions = pgTable("focus_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  plannedDurationMinutes: integer("planned_duration_minutes").notNull(),
  actualDurationMinutes: integer("actual_duration_minutes"),
  interruptionCount: integer("interruption_count").default(0),
  heartRateAvg: integer("heart_rate_avg"),
  fatigueScore: integer("fatigue_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const disciplineScores = pgTable("discipline_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  score: real("score").notNull().default(100),
  penalties: integer("penalties").notNull().default(0),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow().notNull(),
});
