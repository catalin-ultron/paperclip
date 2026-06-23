import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get("taskId");
  return NextResponse.json({ data: { id: taskId, title: "Task Detail", status: "pending" } });
}
