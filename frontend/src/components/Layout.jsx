// src/components/Layout.jsx
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "../styles/layout.css";

export default function Layout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // auto-collapse on small screens initially
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    setSidebarOpen(!mq.matches);
    function onChange(e) {
      if (e.matches) setSidebarOpen(false);
    }
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return (
    <div className={`app-grid ${sidebarOpen ? "with-sidebar" : "no-sidebar"}`}>
      <header className="topbar">
        <Navbar user={user} onLogout={onLogout} onToggleSidebar={() => setSidebarOpen(v => !v)} />
      </header>

      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <Sidebar selected={null} setSelected={() => {}} onClose={() => setSidebarOpen(false)} user={user} />
      </aside>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
}
