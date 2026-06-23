import { db } from "./db";
import { tasks, taskDependencies } from "./db/schema";
import { eq, and } from "drizzle-orm";

export async function canCompleteTask(taskId: string, userId: string): Promise<{ ok: boolean; blockers: string[] }> {
  // Verify task ownership
  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  if (!task) {
    return { ok: false, blockers: ["Task not found or access denied"] };
  }

  // Find all prerequisites for this task
  const deps = await db
    .select({ prereqId: taskDependencies.prerequisiteTaskId })
    .from(taskDependencies)
    .where(eq(taskDependencies.taskId, taskId));

  if (deps.length === 0) {
    return { ok: true, blockers: [] };
  }

  const prereqIds = deps.map((d) => d.prereqId);
  const prereqTasks = await db
    .select({ id: tasks.id, title: tasks.title, status: tasks.status })
    .from(tasks)
    .where(eq(tasks.userId, userId));

  const blockers: string[] = [];
  for (const pt of prereqTasks) {
    if (prereqIds.includes(pt.id) && pt.status !== "complete") {
      blockers.push(pt.title || pt.id);
    }
  }

  return { ok: blockers.length === 0, blockers };
}

export async function detectCycle(taskId: string, newPrereqId: string): Promise<boolean> {
  // BFS upward from newPrereqId to see if it reaches taskId
  const visited = new Set<string>();
  const queue: string[] = [newPrereqId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === taskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const parents = await db
      .select({ prerequisiteTaskId: taskDependencies.prerequisiteTaskId })
      .from(taskDependencies)
      .where(eq(taskDependencies.taskId, current));

    for (const p of parents) {
      queue.push(p.prerequisiteTaskId);
    }
  }
  return false;
}
