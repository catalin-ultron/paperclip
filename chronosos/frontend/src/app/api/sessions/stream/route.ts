import { NextRequest } from "next/server";
import { db } from "@/db";
import { focusSessions } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected", userId: user.id });

      const interval = setInterval(async () => {
        const [active] = await db
          .select()
          .from(focusSessions)
          .where(and(eq(focusSessions.userId, user.id), isNull(focusSessions.endedAt)))
          .orderBy(focusSessions.startedAt)
          .limit(1);

        if (!active) {
          send({ type: "heartbeat", active: false, timeLeft: 0 });
          return;
        }

        const elapsed = Date.now() - new Date(active.startedAt).getTime();
        const remaining = Math.max(0, active.plannedDurationMinutes * 60 * 1000 - elapsed);
        send({ type: "heartbeat", active: true, timeLeft: Math.floor(remaining / 1000), sessionId: active.id });
      }, 5000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
