"use client";

import { useEffect, useState } from "react";
import TaskGraph from "@/components/TaskGraph";
import LockIn from "@/components/LockIn";
import NutritionPanel from "@/components/NutritionPanel";

const USER_ID = "demo";

interface Task {
  id: string;
  title: string;
  status: string;
}

interface TaskDep {
  id: string;
  taskId: string;
  prerequisiteTaskId: string;
}

interface NutritionLog {
  id: string;
  mealName: string;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  hydrationMl: number;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deps, setDeps] = useState<TaskDep[]>([]);
  const [nutrition, setNutrition] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [tRes, nRes] = await Promise.all([
        fetch("/api/tasks", { headers: { "x-user-id": USER_ID } }),
        fetch("/api/nutrition", { headers: { "x-user-id": USER_ID } }),
      ]);

      const tJson = tRes.ok ? await tRes.json() : { data: [] };
      const nJson = nRes.ok ? await nRes.json() : { data: [] };

      const fetchedTasks: Task[] = tJson.data || [];
      const allDeps: TaskDep[] = [];
      for (const task of fetchedTasks) {
        const dRes = await fetch(`/api/tasks/${task.id}/dependencies`, {
          headers: { "x-user-id": USER_ID },
        });
        if (dRes.ok) {
          const dJson = await dRes.json();
          allDeps.push(...(dJson.data || []));
        }
      }

      if (!cancelled) {
        setTasks(fetchedTasks);
        setDeps(allDeps);
        setNutrition(nJson.data || []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-chronos-400">Loading ChronosOS…</div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-chronos-100">ChronosOS</h1>
        <p className="text-chronos-400">Executive Operating System — Task Graph, Nutrition, Deep Work</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-chronos-200 mb-3">Task Graph</h2>
        <TaskGraph tasks={tasks} deps={deps} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NutritionPanel logs={nutrition} />
        <LockIn userId={USER_ID} taskId={tasks[0]?.id || "default"} />
      </div>
    </main>
  );
}
