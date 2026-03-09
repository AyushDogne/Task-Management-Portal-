import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";

type TaskStatus = "pending" | "completed";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
  dueDate?: string;
}

type FilterTab = "all" | "pending" | "completed";

const API_BASE_URL = "http://localhost:5000/api";

export const TaskDashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const filteredTasks = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const loadTasks = async (currentFilter: FilterTab = filter) => {
    try {
      setLoading(true);
      setError(null);
      const statusParam =
        currentFilter === "all" ? "" : `?status=${currentFilter}`;
      const res = await axios.get<Task[]>(
        `${API_BASE_URL}/tasks${statusParam}`
      );
      setTasks(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setCreating(true);
      setError(null);
      const res = await axios.post<Task>(`${API_BASE_URL}/tasks`, {
        title,
        description,
        priority,
      });
      setTasks((prev) => [res.data, ...prev]);
      setTitle("");
      setDescription("");
      setPriority("medium");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await axios.patch<Task>(
        `${API_BASE_URL}/tasks/${id}/toggle`
      );
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data : t)));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update task");
    }
  };

  return (
    <div className="dashboard">
      <header className="top-bar">
        <div>
          <h1 className="app-title">Task Management Portal</h1>
          <p className="app-subtitle">Stay on top of your work</p>
        </div>
        <div className="user-section">
          <span className="user-chip">
            {user?.name} <span className="muted-text">({user?.email})</span>
          </span>
          <button className="ghost-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="card new-task-card">
          <h2>Create task</h2>
          <form className="form horizontal" onSubmit={handleCreateTask}>
            <div className="field">
              <span>Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Short, action-oriented title"
              />
            </div>
            <div className="field">
              <span>Description</span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details"
              />
            </div>
            <div className="field">
              <span>Priority</span>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "low" | "medium" | "high")
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button
              type="submit"
              className="primary-btn"
              disabled={creating || !title.trim()}
            >
              {creating ? "Adding..." : "Add task"}
            </button>
          </form>
        </section>

        <section className="card">
          <div className="tasks-header">
            <div className="tabs">
              {(["all", "pending", "completed"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  className={`tab ${filter === tab ? "active" : ""}`}
                  onClick={() => {
                    setFilter(tab);
                    loadTasks(tab);
                  }}
                >
                  {tab === "all"
                    ? "All"
                    : tab === "pending"
                    ? "Pending"
                    : "Completed"}
                </button>
              ))}
            </div>
            <button className="ghost-btn small" onClick={() => loadTasks()}>
              Refresh
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {loading ? (
            <p className="muted-text">Loading tasks…</p>
          ) : filteredTasks.length === 0 ? (
            <p className="muted-text">No tasks yet. Create your first one!</p>
          ) : (
            <ul className="task-list">
              {filteredTasks.map((task) => (
                <li
                  key={task._id}
                  className={`task-item ${
                    task.status === "completed" ? "completed" : ""
                  }`}
                >
                  <div className="task-main">
                    <div className="task-title-row">
                      <button
                        className="status-toggle"
                        onClick={() => handleToggleStatus(task._id)}
                        aria-label="Toggle status"
                      >
                        {task.status === "completed" ? "✓" : ""}
                      </button>
                      <div>
                        <div className="task-title">{task.title}</div>
                        {task.description && (
                          <div className="task-description">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="task-meta">
                      <span className={`badge ${task.priority}`}>
                        {task.priority} priority
                      </span>
                      <span className="muted-text">
                        Created{" "}
                        {new Date(task.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      {task.status === "completed" && (
                        <span className="status-chip completed">Completed</span>
                      )}
                      {task.status === "pending" && (
                        <span className="status-chip pending">Pending</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

