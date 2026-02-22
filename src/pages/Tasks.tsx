import { useEffect, useState } from 'react';

type Task = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  progress?: number;
  priority?: string;
};

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/tasks')
      .then((r) => r.json())
      .then((data) => setTasks(data.tasks || []))
      .catch(() => setTasks([]));

    // open websocket to receive task updates
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname || 'localhost';
    const port = 3001; // server ws port
    const ws = new WebSocket(`${proto}://${host}:${port}`);
    ws.addEventListener('open', () => setWsConnected(true));
    ws.addEventListener('close', () => setWsConnected(false));
    ws.addEventListener('message', (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.event === 'task:update' && data.task) {
          setTasks((prev) => {
            const idx = prev.findIndex((t) => t.id === data.task.id);
            if (idx === -1) return [data.task, ...prev];
            const copy = [...prev];
            copy[idx] = data.task;
            return copy;
          });
        }
      } catch (e) {
        // ignore
      }
    });

    return () => ws.close();
  }, []);

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description.trim(), priority }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.task) setTasks((s) => [data.task, ...s]);
        setTitle('');
        setDescription('');
      })
      .finally(() => setLoading(false));
  }

  function checkNow() {
    setLoading(true);
    fetch('/api/tasks/check', { method: 'POST' })
      .then((r) => r.json())
      .then(() => alert('Checked — I will start processing tasks shortly'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Task Board</h1>
      <p className="text-sm text-text-muted mb-6">Add tasks for me — I’ll pick them up and check in every hour. Use "Check now" to ask me to start immediately.</p>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <form className="col-span-2 rounded border border-border bg-surface p-4" onSubmit={addTask}>
          <h2 className="font-medium mb-2">New task</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full mb-2 rounded border px-2 py-1 text-black" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full mb-2 rounded border px-2 py-1 text-black" />
          <div className="flex items-center gap-3">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded border px-2 py-1">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button disabled={loading} className="rounded bg-accent px-3 py-1 text-white">Add task</button>
            <button type="button" disabled={loading} onClick={checkNow} className="ml-auto rounded border px-3 py-1">Check now</button>
          </div>
        </form>

        <div className="col-span-1 rounded border border-border bg-surface p-4">
          <h3 className="font-medium mb-2">How to add tasks</h3>
          <ol className="mt-2 list-decimal list-inside text-sm text-text-muted">
            <li>Write a short title (1 line)</li>
            <li>Describe desired outcome in 1–3 bullets</li>
            <li>Set priority (high / medium / low)</li>
          </ol>
        </div>
      </div>

      <div className="rounded border border-border bg-surface p-4">
        <h3 className="font-medium mb-2">Recent tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-sm text-text-muted">No tasks yet.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="rounded border border-border p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-full">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-sm text-text-muted">{t.description}</div>

                    <div className="mt-3">
                      {t.status === 'in-progress' ? (
                        <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
                          <div
                            className="h-3 bg-accent animate-pulse"
                            style={{ width: `${t.progress ?? 20}%`, transition: 'width 300ms linear' }}
                          />
                        </div>
                      ) : t.status === 'complete' ? (
                        <div className="w-full bg-green-100 rounded h-3">
                          <div className="h-3 bg-green-600" style={{ width: '100%' }} />
                        </div>
                      ) : (
                        <div className="text-xs text-text-muted">Status: {t.status ?? 'open'}</div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs font-mono text-text-muted">{t.priority}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
