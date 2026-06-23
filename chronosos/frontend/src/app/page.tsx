"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-4">ChronosOS</h1>
      <p className="text-xl text-gray-600 mb-8">High-Performance Executive Operating System</p>
      <div className="flex gap-4">
        <Link href="/tasks" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Task Graph
        </Link>
        <Link href="/lockin" className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition">
          Deep Work
        </Link>
      </div>
    </main>
  );
}
