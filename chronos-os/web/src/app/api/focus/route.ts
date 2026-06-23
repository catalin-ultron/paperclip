import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { focusSessions } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const focusSchema = z.object({
  taskId: z.string().uuid().optional(),
  plannedDurationMinutes: z.number().int().min(1),
  heartRateAvg: z.number().int().min(0).optional(),
  fatigueScore: z.number().int().min(1).max(10).optional(),
});

export async function GET() {
  const userId = await getCurrentUserId();
  const rows = await db
    .select()
    .from(focusSessions)
    .where(eq(focusSessions.userId, userId))
    .orderBy(desc(focusSessions.createdAt));
  return NextResponse.json({ data: rows });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json();
  const parsed = focusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const [row] = await db
    .insert(focusSessions)
    .values({
      userId,
      taskId: parsed.data.taskId || null,
      startedAt: new Date(),
      plannedDurationMinutes: parsed.data.plannedDurationMinutes,
      heartRateAvg: parsed.data.heartRateAvg || null,
      fatigueScore: parsed.data.fatigueScore || null,
    })
    .returning();

  return NextResponse.json({ data: row }, { status: 201 });
}
