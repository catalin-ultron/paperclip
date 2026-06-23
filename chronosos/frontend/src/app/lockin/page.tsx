"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function LockInPage() {
  const [active, setActive] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [disciplineScore, setDisciplineScore] = useState(100);
  const [summary, setSummary] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const interruptionsRef = useRef(0);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (active) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden && active && sessionId) {
        interruptionsRef.current += 1;
        fetch("/api/focus/" + sessionId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-user-id": "1" },
          body: JSON.stringify({ interruptions: interruptionsRef.current }),
        });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active, sessionId]);

  const start = async () => {
    if (!taskId) return alert("Enter a task ID");
    const res = await fetch("/api/focus", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "1" },
      body: JSON.stringify({ taskId: Number(taskId), plannedDurationMinutes: duration }),
    });
    const data = await res.json();
    setSessionId(data.id);
    setTimeLeft(duration * 60);
    setActive(true);
    setSummary(null);
    interruptionsRef.current = 0;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finish(data.id, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finish = async (sid: number, completed: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActive(false);
    await fetch("/api/focus/" + sid, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": "1" },
      body: JSON.stringify({ completed, endedAt: new Date().toISOString(), interruptions: interruptionsRef.current }),
    });
    const min = Math.floor((duration * 60 - timeLeft) / 60);
    setSummary(`Session ended. Completed: ${completed}. Duration: ${min} min. Interruptions: ${interruptionsRef.current}.`);
  };

  const breakLock = async () => {
    if (!sessionId) return;
    const ok = confirm("This will deduct 5 points from your Discipline Score. Continue?");
    if (!ok) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setActive(false);
    const res = await fetch("/api/sessions/penalty", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "1" },
      body: JSON.stringify({ focusSessionId: sessionId }),
    });
    const data = await res.json();
    if (data.penaltyApplied) setDisciplineScore(data.newScore);
    setSummary(`Session broken. Penalty applied. New Discipline Score: ${data.newScore ?? disciplineScore}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Deep Work</h1>
          <div className="text-sm text-gray-600">Discipline Score: <span className="font-semibold">{disciplineScore}</span></div>
        </div>

        {!active && !summary && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Task ID</label>
              <input type="number" className="mt-1 w-full border rounded px-3 py-2" value={taskId} onChange={(e) => setTaskId(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input type="range" min={5} max={120} className="mt-1 w-full" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              <div className="text-center text-sm text-gray-500">{duration} min</div>
            </div>
            <button onClick={start} className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition">Lock In</button>
          </div>
        )}

        {active && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white">
            <div className="text-6xl font-mono font-bold mb-4">{formatTime(timeLeft)}</div>
            <div className="text-gray-300 mb-8">Stay focused. Tab navigation is restricted.</div>
            <div className="flex gap-4">
              <button onClick={() => sessionId && finish(sessionId, true)} className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition">Complete Early</button>
              <button onClick={breakLock} className="px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition">Break Lock</button>
            </div>
          </div>
        )}

        {summary && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="text-lg font-semibold">{summary}</div>
            <button onClick={() => setSummary(null)} className="px-4 py-2 bg-gray-900 text-white rounded-lg">New Session</button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-600 hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
