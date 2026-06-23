"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

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

function TaskNode({ data }: { data: { label: string; status: string } }) {
  const borderColor =
    data.status === "complete"
      ? "border-green-500"
      : data.status === "in_progress"
      ? "border-amber-500"
      : "border-chronos-600";

  return (
    <div className={`px-4 py-2 rounded-lg border-2 ${borderColor} bg-chronos-800 shadow-lg min-w-[140px]`}>
      <Handle type="target" position={Position.Top} className="!bg-chronos-400" />
      <div className="text-sm font-semibold text-chronos-100">{data.label}</div>
      <div className="text-xs text-chronos-400 capitalize mt-1">{data.status}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-chronos-400" />
    </div>
  );
}

const nodeTypes = { taskNode: TaskNode };

export default function TaskGraph({ tasks, deps }: { tasks: Task[]; deps: TaskDep[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const n: Node[] = tasks.map((t, index) => ({
      id: t.id,
      type: "taskNode",
      position: { x: 200 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 150 },
      data: { label: t.title, status: t.status },
    }));

    const e: Edge[] = deps.map((d) => ({
      id: d.id,
      source: d.prerequisiteTaskId,
      target: d.taskId,
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 2 },
    }));

    setNodes(n);
    setEdges(e);
    setLoading(false);
  }, [tasks, deps, setNodes, setEdges]);

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      // Create dependency via API
      try {
        const res = await fetch(`/api/tasks/${connection.target}/dependencies`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-id": "demo" },
          body: JSON.stringify({ prerequisiteTaskId: connection.source }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Failed to add dependency");
          return;
        }
        setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: "#94a3b8", strokeWidth: 2 } }, eds));
      } catch {
        alert("Network error creating dependency");
      }
    },
    [setEdges]
  );

  if (loading) {
    return <div className="text-chronos-400">Loading graph…</div>;
  }

  return (
    <div className="h-[600px] w-full border border-chronos-700 rounded-lg overflow-hidden bg-chronos-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#475569" gap={16} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  );
}
