import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, taskDependencies } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const taskList = await db.select().from(tasks).where(eq(tasks.userId, user.id));
  const deps = await db.select().from(taskDependencies);

  return NextResponse.json({ tasks: taskList, dependencies: deps });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, priority = 0, dependsOn = [] } = body;

  const [task] = await db
    .insert(tasks)
    .values({ userId: user.id, title, description, priority })
    .returning();

  if (dependsOn.length > 0) {
    const depValues = dependsOn
      .filter((id: number) => id !== task.id)
      .map((id: number) => ({ taskId: task.id, dependsOnTaskId: id }));
    if (depValues.length > 0) {
      await db.insert(taskDependencies).values(depValues);
    }
  }

  return NextResponse.json(task, { status: 201 });
}
