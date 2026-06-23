"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface LockInState {
  status: "idle" | "connecting" | "locked" | "complete" | "penalized";
  startedAt: string | null;
  durationMinutes: number;
  timeRemainingSeconds: number;
}

export function useLockIn(userId: string, taskId: string, durationMinutes: number) {
  const [state, setState] = useState<LockInState>({
    status: "idle",
    startedAt: null,
    durationMinutes,
    timeRemainingSeconds: durationMinutes * 60,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (wsRef.current) return;
    const wsUrl = `ws://localhost:3001?userId=${encodeURIComponent(userId)}&taskId=${encodeURIComponent(taskId)}&duration=${durationMinutes}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    setState((s) => ({ ...s, status: "connecting" }));

    ws.onopen = () => {
      setState((s) => ({ ...s, status: "locked" }));
      timerRef.current = setInterval(() => {
        setState((s) => {
          if (s.timeRemainingSeconds <= 1) {
            return { ...s, timeRemainingSeconds: 0 };
          }
          return { ...s, timeRemainingSeconds: s.timeRemainingSeconds - 1 };
        });
      }, 1000);

      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "HEARTBEAT" }));
        }
      }, 10000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "LOCKIN_STARTED") {
          setState((s) => ({
            ...s,
            status: "locked",
            startedAt: msg.startedAt,
            durationMinutes: msg.durationMinutes,
            timeRemainingSeconds: msg.durationMinutes * 60,
          }));
        }
        if (msg.type === "LOCKIN_COMPLETE") {
          stopTimer();
          setState((s) => ({ ...s, status: "complete" }));
        }
        if (msg.type === "LOCKIN_ENDED") {
          stopTimer();
          setState((s) => ({ ...s, status: "idle", timeRemainingSeconds: s.durationMinutes * 60 }));
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      stopTimer();
      setState((s) => {
        if (s.status === "locked") {
          // Premature disconnect while locked
          return { ...s, status: "penalized" };
        }
        return s;
      });
      wsRef.current = null;
    };

    ws.onerror = () => {
      stopTimer();
      setState((s) => ({ ...s, status: "idle" }));
      wsRef.current = null;
    };
  }, [userId, taskId, durationMinutes]);

  const stop = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "END_SESSION" }));
    }
    stopTimer();
  }, []);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      stopTimer();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { state, start, stop };
}
