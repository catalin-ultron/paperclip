import TaskGraph from "@/components/TaskGraph";
import LockIn from "@/components/LockIn";
import NutritionPanel from "@/components/NutritionPanel";

const USER_ID = "demo";

async function getTasks() {
  const res = await fetch("http://localhost:3000/api/tasks", {
    headers: { "x-user-id": USER_ID },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

async function getDeps() {
  const tasks = await getTasks();
  const allDeps: any[] = [];
  for (const t of tasks) {
    const res = await fetch(`http://localhost:3000/api/tasks/${t.id}/dependencies`, {
      headers: { "x-user-id": USER_ID },
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      allDeps.push(...(json.data || []));
    }
  }
  return allDeps;
}

async function getNutrition() {
  const res = await fetch("http://localhost:3000/api/nutrition", {
    headers: { "x-user-id": USER_ID },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export default async function Home() {
  const [tasks, deps, nutrition] = await Promise.all([getTasks(), getDeps(), getNutrition()]);

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
