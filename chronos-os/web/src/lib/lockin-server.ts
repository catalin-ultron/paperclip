import { WebSocketServer, WebSocket } from "ws";
import { createClient } from "redis";
import http from "http";

const PORT = parseInt(process.env.WS_PORT || "3001", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0";

const redis = createClient({ url: REDIS_URL });
redis.on("error", (err) => console.error("Redis error", err));

const server = http.createServer();
const wss = new WebSocketServer({ server });

interface LockInSession {
  userId: string;
  taskId: string;
  startedAt: string;
  plannedDurationMinutes: number;
  timerId?: NodeJS.Timeout;
}

async function deductDisciplineScore(userId: string, reason: string) {
  try {
    const res = await fetch(`http://localhost:3000/api/penalty`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ userId, reason }),
    });
    if (!res.ok) {
      console.error("Penalty webhook failed:", await res.text());
    }
  } catch (e) {
    console.error("Penalty webhook error:", e);
  }
}

wss.on("connection", async (ws: WebSocket, req) => {
  await redis.connect();
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const userId = url.searchParams.get("userId") || "anonymous";
  const taskId = url.searchParams.get("taskId") || "";
  const duration = parseInt(url.searchParams.get("duration") || "25", 10);

  const sessionKey = `lockin:${userId}`;
  const now = new Date().toISOString();
  const session: LockInSession = {
    userId,
    taskId,
    startedAt: now,
    plannedDurationMinutes: duration,
  };

  await redis.set(sessionKey, JSON.stringify(session), { EX: duration * 60 + 60 });
  console.log(`Lock-in started for user=${userId} task=${taskId} duration=${duration}m`);

  ws.send(JSON.stringify({ type: "LOCKIN_STARTED", startedAt: now, durationMinutes: duration }));

  const timer = setTimeout(async () => {
    ws.send(JSON.stringify({ type: "LOCKIN_COMPLETE" }));
    await redis.del(sessionKey);
    ws.close();
  }, duration * 60 * 1000);

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "HEARTBEAT") {
        ws.send(JSON.stringify({ type: "HEARTBEAT_ACK", ts: new Date().toISOString() }));
      }
      if (msg.type === "END_SESSION") {
        clearTimeout(timer);
        await redis.del(sessionKey);
        ws.send(JSON.stringify({ type: "LOCKIN_ENDED", graceful: true }));
        ws.close();
      }
    } catch {
      // ignore malformed messages
    }
  });

  ws.on("close", async () => {
    clearTimeout(timer);
    const raw = await redis.get(sessionKey);
    if (raw) {
      // Session still in Redis means timer did not expire gracefully
      await redis.del(sessionKey);
      await deductDisciplineScore(userId, "Premature disconnect during deep work block");
      console.log(`Penalty applied to user=${userId} for early disconnect`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket Lock-In server running on ws://localhost:${PORT}`);
});
