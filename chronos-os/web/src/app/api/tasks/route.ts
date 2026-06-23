import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [
      { id: "t1", title: "Morning Review", status: "complete" },
      { id: "t2", title: "Client Pitch Prep", status: "in_progress" },
      { id: "t3", title: "Deep Work Block", status: "pending" },
      { id: "t4", title: "Macro Analysis", status: "pending" },
      { id: "t5", title: "Git Push + Deploy", status: "pending" },
    ],
  });
}
