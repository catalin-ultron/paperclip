import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, taskDependencies } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { canCompleteTask, validateNoCycle } from "@/lib/dag";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const taskId = parseInt(id, 10);

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task || task.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const deps = await db
    .select({ dependsOn: taskDependencies.dependsOnTaskId })
    .from(taskDependencies)
    .where(eq(taskDependencies.taskId, taskId));

  return NextResponse.json({ ...task, dependsOn: deps.map((d) => d.dependsOn) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const taskId = parseInt(id, 10);

  const [existing] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!existing || existing.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, description, status, priority, dependsOn } = body;

  if (status === "complete") {
    const allowed = await canCompleteTask(taskId, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Upstream dependencies incomplete" }, { status: 409 });
    }
  }

  if (dependsOn !== undefined) {
    const newDeps = dependsOn.filter((d: number) => d !== taskId);
    for (const depId of newDeps) {
      const ok = await validateNoCycle(taskId, depId);
      if (!ok) return NextResponse.json({ error: "Cycle detected" }, { status: 409 });
    }
    await db.delete(taskDependencies).where(eq(taskDependencies.taskId, taskId));
    if (newDeps.length > 0) {
      await db.insert(taskDependencies).values(newDeps.map((d: number) => ({ taskId, dependsOnTaskId: d })));
    }
  }

  const [updated] = await db
    .update(tasks)
    .set({ title, description, status, priority, updatedAt: new Date() })
    .where(eq(tasks.id, taskId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const taskId = parseInt(id, 10);

  const [existing] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!existing || existing.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(tasks).where(eq(tasks.id, taskId));
  return NextResponse.json({ deleted: true });
}
