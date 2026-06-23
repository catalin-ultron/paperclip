import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { focusSessions } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const focusId = parseInt(id, 10);

  const [existing] = await db
    .select()
    .from(focusSessions)
    .where(and(eq(focusSessions.id, focusId), eq(focusSessions.userId, user.id)));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { endedAt, completed, interruptions, heartRateEstimate, fatigueEstimate } = body;

  const [updated] = await db
    .update(focusSessions)
    .set({ endedAt: endedAt ? new Date(endedAt) : undefined, completed, interruptions, heartRateEstimate, fatigueEstimate })
    .where(eq(focusSessions.id, focusId))
    .returning();

  return NextResponse.json(updated);
}
