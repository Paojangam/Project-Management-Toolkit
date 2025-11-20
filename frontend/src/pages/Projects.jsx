import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Project.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function NewProjectForm({ onCreated }) {
  const [title, setTitle] = useState('');
  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const p = await api.projects.create({ title });
    onCreated(p);
    setTitle('');
  }
  return (
    <form className="new-project-form" onSubmit={submit}>
      <input
        className="new-project-input"
        placeholder="New project title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <button className="create-btn" type="submit">Create project</button>
    </form>
  );
}

export default function Projects({ onOpen }) {
  const navigate = useNavigate();
  const query = useQuery();

  const [projects, setProjects] = useState([]);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const itemsPerPage = 5;

  const pageFromQuery = parseInt(query.get('page')) || 1;
  const [currentPage, setCurrentPage] = useState(pageFromQuery);

  useEffect(() => {
    api.projects
      .list()
      .then(setProjects)
      .catch(e => setErr(e.message || 'Failed loading projects'));
  }, []);

  async function created(p) {
    try {
      const fullProject = await api.projects.get(p._id || p.id);
      setProjects(prev => [fullProject, ...prev]);
    } catch (e) {
      setProjects(prev => [p, ...prev]);
    }
  }

  const filtered = projects.filter(p => {
    const matchesSearch = !search || 
      (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.owner?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || (p.status || 'active').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const currentProjects = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // handle page change
  const goToPage = (page) => {
    setCurrentPage(page);
    navigate(`?page=${page}`);
  };

  return (
    <div className="projects-shell full-width">
      <main className="projects-main card">
        <header className="projects-header">
          <h2>Projects</h2>
          <div className="header-actions">
            <button className="create-top" onClick={() => document.querySelector('.new-project-input')?.focus()}>
              Create project
            </button>
          </div>
        </header>

        {err && <div className="err">{err}</div>}

        <div className="controls-row">
          <div className="search-filter">
            <input
              className="search-input"
              placeholder="Search projects by title, description, or owner"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <NewProjectForm onCreated={created} />
        </div>

        <div className="projects-table">
          <div className="table-head">
            <div className="col-name">Name</div>
            <div className="col-owner">Owner</div>
            <div className="col-members">Members</div>
            <div className="col-status">Status</div>
            <div className="col-dates">Dates</div>
            <div className="col-actions" />
          </div>

          {currentProjects.length === 0 ? (
            <div className="empty-column">No projects found</div>
          ) : (
            currentProjects.map(p => (
              <div key={p._id || p.id} className="project-card list-item">
                <div className="project-left">
                  <div className="project-avatar" title={p.title}>
                    {(p.title || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div className="project-info">
                    <strong className="project-title">{p.title}</strong>
                    <div className="muted">{p.description || 'No description'}</div>
                  </div>
                </div>

                <div className="project-meta">
                  <div className="col-owner">
                    {p.owner ? (
                      <div className="lead-pill">
                        <div className="lead-avatar">
                          {typeof p.owner === 'object' && p.owner.name 
                            ? getInitials(p.owner.name) 
                            : '?'}
                        </div>
                        <span className="lead-name">
                          {typeof p.owner === 'object' 
                            ? (p.owner.name || p.owner.email || 'Unknown')
                            : 'Loading...'}
                        </span>
                      </div>
                    ) : (
                      <span className="muted">No owner</span>
                    )}
                  </div>
                  <div className="col-members">
                    {p.members && Array.isArray(p.members) && p.members.length > 0 ? (
                      <div className="members-count">
                        <span className="members-text">
                          {p.members.length} {p.members.length === 1 ? 'member' : 'members'}
                        </span>
                        <div className="members-list" title={
                          p.members
                            .map(m => typeof m === 'object' ? (m.name || m.email || 'Unknown') : 'Loading...')
                            .join(', ')
                        }>
                          {p.members.slice(0, 3).map((member, idx) => (
                            <span key={typeof member === 'object' ? (member._id || idx) : idx} className="member-avatar-small">
                              {typeof member === 'object' && (member.name || member.email)
                                ? getInitials(member.name || member.email)
                                : '?'}
                            </span>
                          ))}
                          {p.members.length > 3 && <span className="member-more">+{p.members.length - 3}</span>}
                        </div>
                      </div>
                    ) : (
                      <span className="muted">No members</span>
                    )}
                  </div>
                  <div className="col-status">
                    <span className={`status-badge status-${p.status || 'active'}`}>
                      {(p.status || 'active').charAt(0).toUpperCase() + (p.status || 'active').slice(1)}
                    </span>
                  </div>
                  <div className="col-dates">
                    <div className="date-info">
                      {p.startDate && (
                        <div className="date-item">
                          <span className="date-label">Start:</span> {formatDate(p.startDate)}
                        </div>
                      )}
                      {p.endDate && (
                        <div className="date-item">
                          <span className="date-label">End:</span> {formatDate(p.endDate)}
                        </div>
                      )}
                      {!p.startDate && !p.endDate && <span className="muted">No dates</span>}
                    </div>
                  </div>
                  <div className="col-actions">
                    <button 
                      className="open-btn" 
                      onClick={() => navigate(`/projects/${p._id || p.id}`)}
                    >
                      Open
                    </button>
                    <button className="more-btn" title="More">•••</button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* page numbers */}
          {totalPages > 1 && (
            <div className="columns-index">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={`page-${i}`}
                  className={`col-dot ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => goToPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
