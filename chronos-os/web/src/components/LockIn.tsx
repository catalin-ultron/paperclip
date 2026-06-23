"use client";

import { useState } from "react";
import { useLockIn } from "@/hooks/useLockIn";

export default function LockIn({ userId, taskId }: { userId: string; taskId: string }) {
  const [duration, setDuration] = useState(25);
  const { state, start, stop } = useLockIn(userId, taskId, duration);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-6 border border-chronos-700 rounded-lg bg-chronos-800">
      <h2 className="text-lg font-bold text-chronos-100 mb-4">Deep Work Lock-In</h2>

      {state.status === "idle" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-chronos-400 mb-1">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded bg-chronos-900 border border-chronos-600 text-chronos-100"
            />
          </div>
          <button
            onClick={start}
            className="w-full py-2 rounded bg-green-600 hover:bg-green-500 text-white font-semibold transition"
          >
            Start Lock-In
          </button>
        </div>
      )}

      {state.status === "connecting" && (
        <div className="text-amber-400 text-center py-8">Connecting to lock-in server…</div>
      )}

      {state.status === "locked" && (
        <div className="text-center space-y-6">
          <div className="text-5xl font-mono text-chronos-100">{formatTime(state.timeRemainingSeconds)}</div>
          <div className="text-sm text-chronos-400">Focus block active. Do not close this tab.</div>
          <button
            onClick={stop}
            className="px-6 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-semibold transition"
          >
            End Session
          </button>
        </div>
      )}

      {state.status === "complete" && (
        <div className="text-center text-green-400 py-8">
          <div className="text-2xl font-bold mb-2">Session Complete</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded bg-chronos-700 hover:bg-chronos-600 text-chronos-100 transition"
          >
            Reset
          </button>
        </div>
      )}

      {state.status === "penalized" && (
        <div className="text-center text-red-400 py-8">
          <div className="text-2xl font-bold mb-2">Connection Broken</div>
          <div className="text-sm mb-4">A penalty has been applied to your discipline score.</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded bg-chronos-700 hover:bg-chronos-600 text-chronos-100 transition"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
