import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "complete"]).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, params.id), eq(tasks.userId, userId)));

  if (!row) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ data: row });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, params.id), eq(tasks.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(tasks)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(tasks.id, params.id))
    .returning();

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  const [existing] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, params.id), eq(tasks.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await db.delete(tasks).where(eq(tasks.id, params.id));
  return NextResponse.json({ success: true });
}
