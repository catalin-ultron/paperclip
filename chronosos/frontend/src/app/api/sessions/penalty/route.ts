import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { focusSessions, users } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { focusSessionId } = body;

  const [session] = await db
    .select()
    .from(focusSessions)
    .where(and(eq(focusSessions.id, focusSessionId), eq(focusSessions.userId, user.id)));

  if (!session || session.endedAt) {
    return NextResponse.json({ penaltyApplied: false });
  }

  await db
    .update(focusSessions)
    .set({ endedAt: new Date(), completed: false })
    .where(eq(focusSessions.id, focusSessionId));

  const [u] = await db.select().from(users).where(eq(users.id, user.id));
  const currentScore = parseFloat(u?.disciplineScore ?? "100");
  const newScore = Math.max(0, currentScore - 5);

  await db.update(users).set({ disciplineScore: String(newScore) }).where(eq(users.id, user.id));

  return NextResponse.json({ penaltyApplied: true, newScore });
}
