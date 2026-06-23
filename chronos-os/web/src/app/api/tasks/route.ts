import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

export async function GET() {
  const userId = await getCurrentUserId();
  const rows = await db.select().from(tasks).where(eq(tasks.userId, userId));
  return NextResponse.json({ data: rows });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const [row] = await db
    .insert(tasks)
    .values({
      userId,
      title: parsed.data.title,
      description: parsed.data.description,
    })
    .returning();

  return NextResponse.json({ data: row }, { status: 201 });
}
