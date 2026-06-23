import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get("taskId");
  // Return demo dependencies
  const deps: any[] = [];
  if (taskId === "t3") {
    deps.push({ id: "d1", taskId: "t3", prerequisiteTaskId: "t2" });
  }
  if (taskId === "t5") {
    deps.push({ id: "d2", taskId: "t5", prerequisiteTaskId: "t3" });
    deps.push({ id: "d3", taskId: "t5", prerequisiteTaskId: "t4" });
  }
  return NextResponse.json({ data: deps });
}
