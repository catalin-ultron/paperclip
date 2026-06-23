import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { focusSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(focusSessions).where(eq(focusSessions.userId, user.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { taskId, plannedDurationMinutes } = body;

  const [row] = await db
    .insert(focusSessions)
    .values({ userId: user.id, taskId, plannedDurationMinutes })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
