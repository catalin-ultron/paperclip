"use client";

import { useEffect, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
} from "reactflow";
import "reactflow/dist/style.css";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "complete";
  priority: number;
}

interface Dep {
  taskId: number;
  dependsOnTaskId: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0);
  const [dependsOn, setDependsOn] = useState<number[]>([]);

  const fetchTasks = async () => {
    const res = await fetch("/api/tasks", { headers: { "x-user-id": "1" } });
    const data = await res.json();
    setTasks(data.tasks || []);

    const ns: Node[] = (data.tasks || []).map((t: Task, i: number) => ({
      id: String(t.id),
      position: { x: (i % 5) * 220 + 20, y: Math.floor(i / 5) * 120 + 20 },
      data: { label: t.title, task: t },
      className: t.status,
    }));
    const es: Edge[] = (data.dependencies || []).map((d: Dep, i: number) => ({
      id: `e${i}`,
      source: String(d.dependsOnTaskId),
      target: String(d.taskId),
    }));
    setNodes(ns);
    setEdges(es);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target) return;
      setEdges((eds) => addEdge(conn, eds));
      fetch("/api/tasks/" + conn.target, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": "1" },
        body: JSON.stringify({ dependsOn: [parseInt(conn.source)] }),
      }).then(fetchTasks);
    },
    [setEdges]
  );

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "1" },
      body: JSON.stringify({ title, description, priority, dependsOn }),
    });
    setTitle("");
    setDescription("");
    setDependsOn([]);
    fetchTasks();
  };

  const markComplete = async (taskId: number) => {
    const res = await fetch("/api/tasks/" + taskId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": "1" },
      body: JSON.stringify({ status: "complete" }),
    });
    if (res.status === 409) {
      alert("Dependencies not complete");
      return;
    }
    fetchTasks();
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b bg-white flex gap-4 items-end">
        <form onSubmit={createTask} className="flex gap-2 items-end flex-1">
          <div>
            <label className="block text-xs text-gray-500">Title</label>
            <input className="border rounded px-2 py-1" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Description</label>
            <input className="border rounded px-2 py-1" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Priority</label>
            <input type="number" className="border rounded px-2 py-1 w-20" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Depends On</label>
            <select multiple className="border rounded px-2 py-1 h-10" value={dependsOn.map(String)} onChange={(e) => setDependsOn(Array.from(e.target.selectedOptions).map((o) => Number(o.value)))}>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
        </form>
        <div className="text-sm text-gray-500">Legend: Gray=ToDo Blue=In Progress Green=Complete</div>
      </div>
      <div className="flex-1">
        {loading ? (
          <div className="p-8 text-gray-500">Loading tasks...</div>
        ) : (
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        )}
      </div>
      <div className="p-2 bg-white border-t text-xs text-gray-500 flex gap-2">
        {tasks.map((t) => (
          <button key={t.id} onClick={() => markComplete(t.id)} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">
            Complete #{t.id}
          </button>
        ))}
      </div>
    </div>
  );
}
