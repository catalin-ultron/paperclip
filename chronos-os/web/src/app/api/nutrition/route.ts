import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nutritionLogs } from "@/lib/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const nutritionSchema = z.object({
  mealName: z.string().min(1).max(255),
  proteinG: z.number().min(0).default(0),
  fatG: z.number().min(0).default(0),
  carbsG: z.number().min(0).default(0),
  fiberG: z.number().min(0).default(0),
  hydrationMl: z.number().min(0).default(0),
  micronutrients: z.record(z.number()).optional(),
});

export async function GET() {
  const userId = await getCurrentUserId();
  const rows = await db
    .select()
    .from(nutritionLogs)
    .where(eq(nutritionLogs.userId, userId))
    .orderBy(desc(nutritionLogs.loggedAt));
  return NextResponse.json({ data: rows });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json();
  const parsed = nutritionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const [row] = await db
    .insert(nutritionLogs)
    .values({
      userId,
      ...parsed.data,
      micronutrients: parsed.data.micronutrients ? JSON.stringify(parsed.data.micronutrients) : null,
    })
    .returning();

  return NextResponse.json({ data: row }, { status: 201 });
}
