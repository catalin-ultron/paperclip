import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { disciplineScores } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json();
  const reason = body.reason || "Unspecified violation";

  const [existing] = await db
    .select()
    .from(disciplineScores)
    .where(eq(disciplineScores.userId, userId));

  const penaltyAmount = 5;

  if (existing) {
    const newScore = Math.max(0, existing.score - penaltyAmount);
    const [updated] = await db
      .update(disciplineScores)
      .set({
        score: newScore,
        penalties: existing.penalties + 1,
        lastUpdated: new Date(),
      })
      .where(eq(disciplineScores.id, existing.id))
      .returning();
    return NextResponse.json({ data: updated, reason });
  }

  const [created] = await db
    .insert(disciplineScores)
    .values({
      userId,
      score: 100 - penaltyAmount,
      penalties: 1,
    })
    .returning();

  return NextResponse.json({ data: created, reason }, { status: 201 });
}
