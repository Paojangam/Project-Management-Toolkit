// src/pages/Homepage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import "../styles/Homepage.css";
import Sidebar from "../components/Sidebar";



export default function Homepage({ user = null }) {
  const navigate = useNavigate();

  const [projects, setProjects] = useState(null);
  const [loading, setLoading] = useState({ projects: false });
  const [error, setError] = useState({ projects: null });

  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      setLoading((l) => ({ ...l, projects: true }));
      setError((e) => ({ ...e, projects: null }));
      try {
        const list = await api.projects.list();
        if (!mounted) return;
        setProjects(Array.isArray(list) ? list : list.items || []);
      } catch (err) {
        if (!mounted) return;
        setError((e) => ({
          ...e,
          projects: err.message || "Failed to load projects",
        }));
        setProjects([]);
      } finally {
        if (mounted) setLoading((l) => ({ ...l, projects: false }));
      }
    }

    loadProjects();
    return () => {
      mounted = false;
    };
  }, []);

  const recentProjects = useMemo(() => {
    if (!projects) return [];
    return projects.slice(0, 3);
  }, [projects]);

  function openProject(id) {
    navigate(`/projects/${id}`);
  }

  return (
    <div className="hp-root">

      <div className="hp-main">
        <main className="hp-content">
          <div className="page-left">
            <h2 className="page-title">For you</h2>

            <section className="card recent-projects">
              <div className="rp-header">
                <div className="rp-title">Recent projects</div>
                <a
                  className="view-all"
                  href="#view"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/projects');
                  }}
                >
                  View all projects
                </a>
              </div>

              <div className="rp-body">
                {loading.projects && <div className="empty">Loading projects…</div>}
                {error.projects && <div className="empty error">Error: {error.projects}</div>}

                {!loading.projects && !error.projects && (!projects || projects.length === 0) && (
                  <div className="empty">No projects found.</div>
                )}

                {/* Horizontal row that shows at most 2 recent projects */}
                {!loading.projects && !error.projects && (
                  <div className="rp-row">
                    {recentProjects.slice(0, 2).map((p) => (
                      <div className="project-tile" key={p._id || p.id}>
                        <div className="tile-left">
                          <div className="badge" aria-hidden>
                            {(p.title || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div className="tile-info">
                            <div className="tile-name">{p.title}</div>
                            <div className="tile-desc">
                              {p.description || 'No description'}
                            </div>
                          </div>
                        </div>
                        <div className="tile-right">
                          <div className="tile-links">
                            <div className="quick">Project Info</div>
                            <div className="links-list">
                              {p.owner && (
                                <div className="link-info">
                                  Owner: {typeof p.owner === 'object' ? (p.owner.name || p.owner.email) : 'Unknown'}
                                </div>
                              )}
                              {p.members && p.members.length > 0 && (
                                <div className="link-info">
                                  Members: {p.members.length}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="open-row">
                            <div className="boards">Status: {p.status || 'active'}</div>
                            <button
                              className="btn small"
                              onClick={() => navigate(`/projects/${p._id || p.id}`)}
                            >
                              Open
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {projects && projects.length > 3 && (
                <div className="rp-footer">
                  <button
                    className="btn ghost"
                    onClick={() => navigate('/projects')}
                  >
                    View all projects
                  </button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
