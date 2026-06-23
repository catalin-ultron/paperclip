import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [
      { id: "n1", mealName: "Breakfast Oats", proteinG: 18, fatG: 12, carbsG: 65, fiberG: 8, hydrationMl: 350 },
      { id: "n2", mealName: "Chicken Salad", proteinG: 42, fatG: 22, carbsG: 18, fiberG: 12, hydrationMl: 500 },
    ],
  });
}
