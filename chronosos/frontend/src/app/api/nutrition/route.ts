import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { nutritionEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(nutritionEntries).where(eq(nutritionEntries.userId, user.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, calories, proteinG, fatG, carbsG, hydrationMl = 0, micronutrients = {} } = body;

  const [row] = await db
    .insert(nutritionEntries)
    .values({ userId: user.id, name, calories, proteinG, fatG, carbsG, hydrationMl, micronutrients })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
