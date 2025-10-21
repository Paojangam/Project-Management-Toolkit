import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import '../styles/ProjectDetail.css';

function TaskForm({ onCreated, projectId }) {
  const [title, setTitle] = useState('');
  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const t = await api.tasks.create({ title, project: projectId });
    onCreated(t);
    setTitle('');
  }
  return (
    <form onSubmit={submit} className="inline-form">
      <input placeholder="New task title" value={title} onChange={e=>setTitle(e.target.value)} required />
      <button type="submit">Add Task</button>
    </form>
  );
}

export default function ProjectDetail({ socket }) {
  const { id: projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10; // tasks per page

  const fetchTasks = async (p = page) => {
    try {
      const data = await api.tasks.list({ project: projectId, page: p, limit });
      setTasks(data);
      setTotalPages(Math.ceil(data.length / limit) || 1);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    if (!projectId) return;

    api.projects.get(projectId)
      .then(setProject)
      .catch(e => setErr(e.message));

    fetchTasks(page);

    // WebSocket listeners
    if (socket) {
      socket.on('taskCreated', t => {
        if (t.project._id === projectId) setTasks(prev => [t, ...prev]);
      });
      socket.on('taskUpdated', t => {
        setTasks(prev => prev.map(ts => (ts._id === t._id ? t : ts)));
      });
      socket.on('taskDeleted', ({ taskId }) => {
        setTasks(prev => prev.filter(ts => ts._id !== taskId));
      });
    }

    return () => {
      if (socket) {
        socket.off('taskCreated');
        socket.off('taskUpdated');
        socket.off('taskDeleted');
      }
    };
  }, [projectId, page, socket]);

  const addTask = t => setTasks(prev => [t, ...prev]);

  const toggleDone = async t => {
    try {
      const updated = await api.tasks.update(t._id, {
        status: t.status === 'done' ? 'todo' : 'done'
      });
      setTasks(prev => prev.map(ts => ts._id === updated._id ? updated : ts));
    } catch (e) {
      setErr(e.message);
    }
  };

  const deleteTask = async t => {
    try {
      await api.tasks.delete(t._id);
      setTasks(prev => prev.filter(ts => ts._id !== t._id));
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="card project-detail">
      <h2>{project ? project.title || project.name : 'Project'}</h2>
      {err && <div className="err">{err}</div>}

      <TaskForm onCreated={addTask} projectId={projectId} />

      <ul className="list">
        {tasks.map(t => (
          <li key={t._id} className="list-item">
            <div>
              <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleDone(t)} />
              <span className={t.status === 'done' ? 'done' : ''}>{t.title}</span>
            </div>
            <div className="task-actions">
              <span className="muted small">{t.assignee?.name || t.assignee?.email || ''}</span>
              <button onClick={() => deleteTask(t)} className="delete-btn">Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={page === i+1 ? 'active' : ''} onClick={() => setPage(i+1)}>
              {i+1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
