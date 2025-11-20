import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import '../styles/ProjectDetail.css';

function Comments({ taskId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!taskId) return;
    const fetchComments = async () => {
      try {
        const data = await api.comments.list(taskId);
        setComments(data);
      } catch (e) {
        setErr(e.message);
      }
    };
    fetchComments();
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setErr('');
    try {
      const newComment = await api.comments.create({ taskId, text: text.trim() });
      setComments(prev => [...prev, newComment]);
      setText('');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.comments.remove(commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (e) {
      setErr(e.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canDelete = (comment) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (typeof comment.author === 'object' && comment.author._id) {
      return String(comment.author._id) === String(currentUser._id);
    }
    if (typeof comment.author === 'string') {
      return String(comment.author) === String(currentUser._id);
    }
    return false;
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h4 className="comments-title">Comments ({comments.length})</h4>
      </div>
      
      {err && <div className="comment-err">{err}</div>}

      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          className="comment-input"
          placeholder="Add a comment..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="comment-submit-btn"
          disabled={loading || !text.trim()}
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">No comments yet. Be the first to comment!</div>
        ) : (
          comments.map(comment => (
            <div key={comment._id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  {typeof comment.author === 'object' ? (
                    <>
                      <span className="comment-author-name">
                        {comment.author.name || comment.author.email || 'Unknown'}
                      </span>
                      <span className="comment-date">
                        {formatDate(comment.createdAt)}
                      </span>
                    </>
                  ) : (
                    <span className="comment-author-name">Loading...</span>
                  )}
                </div>
                {canDelete(comment) && (
                  <button
                    className="comment-delete-btn"
                    onClick={() => handleDelete(comment._id)}
                    title="Delete comment"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="comment-text">{comment.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TaskForm({ onCreated, projectId }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  
  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title,
      project: projectId,
      description: description.trim() || '',
      priority: priority || 'medium',
      dueDate: dueDate || null
    };
    const t = await api.tasks.create(payload);
    onCreated(t);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
  }
  return (
    <form onSubmit={submit} className="inline-form">
      <input 
        className="task-input-title"
        placeholder="New task title" 
        value={title} 
        onChange={e=>setTitle(e.target.value)} 
        required 
      />
      <input 
        className="task-input-description"
        placeholder="Description (optional)" 
        value={description} 
        onChange={e=>setDescription(e.target.value)} 
      />
      <select 
        className="task-input-priority"
        value={priority} 
        onChange={e=>setPriority(e.target.value)}
      >
        <option value="low">Low Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="high">High Priority</option>
      </select>
      <input 
        className="task-input-due-date"
        type="date"
        value={dueDate} 
        onChange={e=>setDueDate(e.target.value)} 
      />
      <button className="task-submit-btn" type="submit">Add Task</button>
    </form>
  );
}

export default function ProjectDetail({ socket }) {
  const { id: projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
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

    api.auth.me()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));

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

  const toggleStatus = async t => {
    try {
      let newStatus;
      if (t.status === 'done') {
        newStatus = 'todo';
      } else if (t.status === 'todo') {
        newStatus = 'inprogress';
      } else {
        newStatus = 'done';
      }
      const updated = await api.tasks.update(t._id, {
        status: newStatus
      });
      setTasks(prev => prev.map(ts => ts._id === updated._id ? updated : ts));
    } catch (e) {
      setErr(e.message);
    }
  };
  

  const deleteTask = async t => {
    try {
      await api.tasks.remove(t._id);
      setTasks(prev => prev.filter(ts => ts._id !== t._id));
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="card project-detail">
      <h2>{project ? project.title : 'Project'}</h2>
      {project && project.description && <p className="project-description">{project.description}</p>}
      {err && <div className="err">{err}</div>}

      <TaskForm onCreated={addTask} projectId={projectId} />

      <ul className="list">
        {tasks.map(t => (
          <li key={t._id} className="list-item task-with-comments">
            <div className="task-wrapper">
              <div className="task-main">
                <button 
                  className={`status-toggle status-${t.status || 'todo'}`}
                  onClick={() => toggleStatus(t)}
                  title={`Status: ${t.status || 'todo'}`}
                >
                  {t.status === 'done' ? '✓' : t.status === 'inprogress' ? '⟳' : '○'}
                </button>
                <div className="task-info">
                  <span className={`task-title ${t.status === 'done' ? 'done' : ''}`}>{t.title}</span>
                  {t.description && <span className="task-description muted">{t.description}</span>}
                  <div className="task-meta">
                    {t.priority && (
                      <span className={`priority-badge priority-${t.priority}`}>
                        {t.priority}
                      </span>
                    )}
                    {t.dueDate && (
                      <span className="due-date muted">
                        Due: {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="task-actions">
                {t.assignee ? (
                  <span className="assignee-info muted">
                    {typeof t.assignee === 'object' 
                      ? (t.assignee.name || t.assignee.email || 'Assigned')
                      : 'Assigned'}
                  </span>
                ) : (
                  <span className="assignee-info muted">Unassigned</span>
                )}
                <button onClick={() => deleteTask(t)} className="delete-btn">Delete</button>
              </div>
            </div>
            <Comments taskId={t._id} currentUser={currentUser} />
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
