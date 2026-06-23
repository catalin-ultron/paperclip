import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { canCompleteTask } from "@/lib/dag";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  const validation = await canCompleteTask(params.id, userId);

  if (!validation.ok) {
    return NextResponse.json(
      { error: "Blocked by incomplete dependencies", blockers: validation.blockers },
      { status: 409 }
    );
  }

  const [updated] = await db
    .update(tasks)
    .set({ status: "complete", updatedAt: new Date() })
    .where(eq(tasks.id, params.id))
    .returning();

  return NextResponse.json({ data: updated });
}
