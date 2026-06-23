"use server";

import { db } from "@/db";
import { tasks, taskDependencies } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function getUpstreamDependencies(taskId: number): Promise<number[]> {
  const rows = await db
    .select({ dependsOn: taskDependencies.dependsOnTaskId })
    .from(taskDependencies)
    .where(eq(taskDependencies.taskId, taskId));
  return rows.map((r) => r.dependsOn);
}

export async function canCompleteTask(taskId: number, userId: number): Promise<boolean> {
  const deps = await getUpstreamDependencies(taskId);
  if (deps.length === 0) return true;

  const upstreamTasks = await db
    .select({ status: tasks.status })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), inArray(tasks.id, deps)));

  return upstreamTasks.every((t) => t.status === "complete");
}

export async function validateNoCycle(taskId: number, dependsOnId: number): Promise<boolean> {
  const visited = new Set<number>();
  const stack = [taskId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === dependsOnId) return false; // cycle detected
    if (visited.has(current)) continue;
    visited.add(current);
    const children = await db
      .select({ tid: taskDependencies.taskId })
      .from(taskDependencies)
      .where(eq(taskDependencies.dependsOnTaskId, current));
    for (const c of children) stack.push(c.tid);
  }
  return true;
}
