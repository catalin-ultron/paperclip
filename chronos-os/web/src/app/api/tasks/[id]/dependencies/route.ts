import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskDependencies } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { detectCycle } from "@/lib/dag";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const addDepSchema = z.object({
  prerequisiteTaskId: z.string().uuid(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  const deps = await db
    .select({
      id: taskDependencies.id,
      taskId: taskDependencies.taskId,
      prerequisiteTaskId: taskDependencies.prerequisiteTaskId,
    })
    .from(taskDependencies)
    .where(eq(taskDependencies.taskId, params.id));

  return NextResponse.json({ data: deps });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  const body = await request.json();
  const parsed = addDepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  if (parsed.data.prerequisiteTaskId === params.id) {
    return NextResponse.json({ error: "A task cannot depend on itself" }, { status: 400 });
  }

  const cycle = await detectCycle(params.id, parsed.data.prerequisiteTaskId);
  if (cycle) {
    return NextResponse.json({ error: "Adding this dependency would create a cycle" }, { status: 400 });
  }

  const [row] = await db
    .insert(taskDependencies)
    .values({
      taskId: params.id,
      prerequisiteTaskId: parsed.data.prerequisiteTaskId,
    })
    .returning();

  return NextResponse.json({ data: row }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  const { searchParams } = new URL(request.url);
  const prereqId = searchParams.get("prerequisiteTaskId");
  if (!prereqId) {
    return NextResponse.json({ error: "prerequisiteTaskId required" }, { status: 400 });
  }

  await db
    .delete(taskDependencies)
    .where(
      and(eq(taskDependencies.taskId, params.id), eq(taskDependencies.prerequisiteTaskId, prereqId))
    );

  return NextResponse.json({ success: true });
}
