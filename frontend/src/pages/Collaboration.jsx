import React, { useEffect, useState } from "react";
import { PageHeader, LoadingSpinner } from "../components/Common";
import { collaborationService } from "../services/api";

const COLUMNS = ["To Do", "In Progress", "Blocked", "Done"];

export default function Collaboration() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");

  const load = async () => {
    setLoading(true);
    const [t, p] = await Promise.all([
      collaborationService.list("tasks"),
      collaborationService.list("projects"),
    ]);
    setTasks(t);
    setProjects(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addTask = async () => {
    if (!newTask.trim()) return;
    await collaborationService.create("tasks", { title: newTask, status: "To Do", priority: "Normal" });
    setNewTask("");
    load();
  };

  const moveTask = async (id, status) => {
    await collaborationService.update("tasks", id, { status });
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collaboration Workspace"
        subtitle="Lightweight project & task workspace, separate from the dissertation dataset analysis above."
      />

      <div className="card flex items-center gap-2">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="New task title..."
          className="flex-1 border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
        <button className="btn-primary" onClick={addTask}>Add Task</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col} className="card min-h-[200px]">
            <div className="font-semibold text-sm text-ink-600 mb-3">{col}</div>
            <div className="space-y-2">
              {tasks.filter((t) => t.status === col).map((t) => (
                <div key={t.id} className="bg-ink-50 rounded-lg p-2.5 text-sm">
                  <div className="font-medium text-ink-800">{t.title}</div>
                  <select
                    value={t.status}
                    onChange={(e) => moveTask(t.id, e.target.value)}
                    className="mt-1.5 text-xs border border-ink-200 rounded-lg px-2 py-1 w-full"
                  >
                    {COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
              {tasks.filter((t) => t.status === col).length === 0 && (
                <div className="text-xs text-ink-300">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card text-sm text-ink-500">
        This workspace module (projects, tasks, requirements, meetings, notifications) is
        an MVP built on an in-memory store for demonstration. See{" "}
        <code className="bg-ink-100 px-1 rounded">database/schema.sql</code> for the full
        PostgreSQL schema this would persist to in production.
      </div>
    </div>
  );
}
