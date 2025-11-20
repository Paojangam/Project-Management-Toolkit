// src/components/Sidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Sidebar.css';

const ROUTE_MAP = {
  homepage: "/",
  recent: "/recent",
  starred: "/starred",
  apps: "/apps",
  projects: "/projects",
  dashboard: "/dashboard",
};

export default function Sidebar({ selected, setSelected }) {
  const navigate = useNavigate();
  const items = [
    { key: "for-you", label: "For you", icon: "🏷", route: "homepage" },
    { key: "apps", label: "Apps", icon: "◼", route: "apps" },
    { key: "projects", label: "Projects", icon: "🗂", route: "projects" },
    { key: "dashboards", label: "Dashboards", icon: "📊", route: "dashboard" },
  ];

  function clickItem(it) {
    setSelected(it.key);
    const path = ROUTE_MAP[it.route];
    if (typeof path === "function") {
      navigate(path());
    } else if (path) {
      navigate(path);
    } else {
      navigate("/");
    }
  }

  return (
    <aside className="hp-sidebar">
      <div
        className="brand"
        onClick={() => clickItem(items[0])}
        role="button"
        tabIndex={0}
      >
        
      </div>

      <nav className="nav-list">
        {items.map((it) => (
          <div
            key={it.key}
            className={`nav-item ${selected === it.key ? "active" : ""}`}
            onClick={() => clickItem(it)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && clickItem(it)}
          >
            <span className="nav-icon">{it.icon}</span>
            <span className="nav-label">{it.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="ghost"
          onClick={() => {
            setSelected("customize");
            navigate("/customize-sidebar");
          }}
        >
          Customize sidebar
        </button>
      </div>
    </aside>
  );
}
