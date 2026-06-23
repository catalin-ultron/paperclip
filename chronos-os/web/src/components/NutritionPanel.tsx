"use client";

import { useState } from "react";

interface NutritionLog {
  id: string;
  mealName: string;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  hydrationMl: number;
}

export default function NutritionPanel({ logs }: { logs: NutritionLog[] }) {
  const [form, setForm] = useState({
    mealName: "",
    proteinG: "",
    fatG: "",
    carbsG: "",
    fiberG: "",
    hydrationMl: "",
  });

  const totals = logs.reduce(
    (acc, log) => ({
      proteinG: acc.proteinG + (log.proteinG || 0),
      fatG: acc.fatG + (log.fatG || 0),
      carbsG: acc.carbsG + (log.carbsG || 0),
      fiberG: acc.fiberG + (log.fiberG || 0),
      hydrationMl: acc.hydrationMl + (log.hydrationMl || 0),
    }),
    { proteinG: 0, fatG: 0, carbsG: 0, fiberG: 0, hydrationMl: 0 }
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "demo" },
      body: JSON.stringify({
        mealName: form.mealName,
        proteinG: Number(form.proteinG) || 0,
        fatG: Number(form.fatG) || 0,
        carbsG: Number(form.carbsG) || 0,
        fiberG: Number(form.fiberG) || 0,
        hydrationMl: Number(form.hydrationMl) || 0,
      }),
    });
    window.location.reload();
  };

  return (
    <div className="p-6 border border-chronos-700 rounded-lg bg-chronos-800 space-y-6">
      <h2 className="text-lg font-bold text-chronos-100">Nutrition Engine</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
        <MacroCard label="Protein" value={totals.proteinG} unit="g" color="text-blue-400" />
        <MacroCard label="Fat" value={totals.fatG} unit="g" color="text-yellow-400" />
        <MacroCard label="Carbs" value={totals.carbsG} unit="g" color="text-orange-400" />
        <MacroCard label="Fiber" value={totals.fiberG} unit="g" color="text-green-400" />
        <MacroCard label="Hydration" value={totals.hydrationMl} unit="ml" color="text-cyan-400" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Meal name"
            value={form.mealName}
            onChange={(e) => setForm({ ...form, mealName: e.target.value })}
            className="col-span-2 px-3 py-2 rounded bg-chronos-900 border border-chronos-600 text-chronos-100"
          />
          <input placeholder="Protein (g)" type="number" value={form.proteinG} onChange={(e) => setForm({ ...form, proteinG: e.target.value })} className="px-3 py-2 rounded bg-chronos-900 border border-chronos-600 text-chronos-100" />
          <input placeholder="Fat (g)" type="number" value={form.fatG} onChange={(e) => setForm({ ...form, fatG: e.target.value })} className="px-3 py-2 rounded bg-chronos-900 border border-chronos-600 text-chronos-100" />
          <input placeholder="Carbs (g)" type="number" value={form.carbsG} onChange={(e) => setForm({ ...form, carbsG: e.target.value })} className="px-3 py-2 rounded bg-chronos-900 border border-chronos-600 text-chronos-100" />
          <input placeholder="Fiber (g)" type="number" value={form.fiberG} onChange={(e) => setForm({ ...form, fiberG: e.target.value })} className="px-3 py-2 rounded bg-chronos-900 border border-chronos-600 text-chronos-100" />
          <input placeholder="Hydration (ml)" type="number" value={form.hydrationMl} onChange={(e) => setForm({ ...form, hydrationMl: e.target.value })} className="col-span-2 px-3 py-2 rounded bg-chronos-900 border border-chronos-600 text-chronos-100" />
        </div>
        <button type="submit" className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition">
          Log Meal
        </button>
      </form>
    </div>
  );
}

function MacroCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="bg-chronos-900 rounded p-3 border border-chronos-700">
      <div className="text-xs text-chronos-400 uppercase">{label}</div>
      <div className={`text-xl font-bold ${color}`}>
        {value.toFixed(1)}
        <span className="text-sm ml-1 text-chronos-500">{unit}</span>
      </div>
    </div>
  );
}
