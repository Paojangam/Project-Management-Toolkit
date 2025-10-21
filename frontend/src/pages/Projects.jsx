import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Project.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
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
  const [productFilter, setProductFilter] = useState('');

  const itemsPerPage = 5;

  // read current page from URL ?page=1
  const pageFromQuery = parseInt(query.get('page')) || 1;
  const [currentPage, setCurrentPage] = useState(pageFromQuery);

  useEffect(() => {
    api.projects
      .list()
      .then(setProjects)
      .catch(e => setErr(e.message || 'Failed loading projects'));
  }, []);

  function created(p) {
    setProjects(prev => [p, ...prev]);
  }

  const filtered = projects.filter(p => {
    const matchesSearch = !search || (p.title || p.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesProduct = !productFilter || (p.product || '').toLowerCase() === productFilter.toLowerCase();
    return matchesSearch && matchesProduct;
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
              placeholder="Search projects"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="product-filter" value={productFilter} onChange={e => setProductFilter(e.target.value)}>
              <option value="">Filter by product</option>
              <option value="business">Business</option>
              <option value="service">Service</option>
            </select>
          </div>

          <NewProjectForm onCreated={created} />
        </div>

        <div className="projects-table">
          <div className="table-head">
            <div className="col-name">Name</div>
            <div className="col-key">Key</div>
            <div className="col-type">Type</div>
            <div className="col-lead">Lead</div>
            <div className="col-actions" />
          </div>

          {currentProjects.length === 0 ? (
            <div className="empty-column">No projects found</div>
          ) : (
            currentProjects.map(p => (
              <div key={p._id || p.id} className="project-card list-item">
                <div className="project-left">
                  <div className="project-avatar" title={p.title || p.name}>
                    {(p.iconEmoji || (p.title || p.name || 'P').charAt(0)).slice(0, 2)}
                  </div>
                  <div className="project-info">
                    <strong className="project-title">{p.title || p.name}</strong>
                    <div className="muted">{p.description}</div>
                  </div>
                </div>

                <div className="project-meta">
                  <div className="col-key">{p.key || (p._id || p.id).slice?.(0, 3)}</div>
                  <div className="col-type">{p.type || 'Company-managed business'}</div>
                  <div className="col-lead">
                    <div className="lead-pill">
                      <div className="lead-avatar">{p.leadInitials || 'PK'}</div>
                      <span className="lead-name">{p.leadName || p.lead || 'Paojangam Kipgen'}</span>
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
