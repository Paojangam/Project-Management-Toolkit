// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Layout from "./components/Layout"; 
import Login from "./pages/Login";
import Register from "./pages/Register";
import Homepage from "./pages/Homepage";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import { api } from "./api";

function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Placeholder({ title }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <h2>{title}</h2>
      <p style={{ color: "#6b7280" }}>{title} page is not implemented yet.</p>
    </div>
  );
}

function AppRoutes({ user, onLogout, onLoginSuccess }) {
  return (
    <Routes>
      {/* Public routes (no chrome) */}
      <Route path="/login" element={<Login onLoginSuccess={onLoginSuccess} />} />
      <Route path="/register" element={<Register />} />

      {/* All routes inside Layout show Navbar + Sidebar */}
      <Route element={<Layout user={user} onLogout={onLogout} />}>
        <Route
          path="/"
          element={
            <RequireAuth user={user}>
              <Homepage user={user} />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth user={user}>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/projects"
          element={
            <RequireAuth user={user}>
              <Projects />
            </RequireAuth>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <RequireAuth user={user}>
              <ProjectDetail />
            </RequireAuth>
          }
        />
        {/* placeholders so sidebar links don't 404 */}
        <Route path="/recent" element={<RequireAuth user={user}><Placeholder title="Recent" /></RequireAuth>} />
        <Route path="/starred" element={<RequireAuth user={user}><Placeholder title="Starred" /></RequireAuth>} />
        <Route path="/apps" element={<RequireAuth user={user}><Placeholder title="Apps" /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth user={user}><Placeholder title="Profile" /></RequireAuth>} />
        <Route path="/plans" element={<RequireAuth user={user}><Placeholder title="Plans" /></RequireAuth>} />

        {/* fallback inside layout */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Route>
    </Routes>
  );
}

/* Outer App: just provides router context */
export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

/* Inner app which needs hooks that must live inside BrowserRouter */
function AppInner() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    if (!token) {
      if (mounted) setReady(true);
      return;
    }

    // Use an async wrapper for clarity
    (async () => {
      try {
        const u = await api.auth.me();
        if (!mounted) return;
        setUser(u);
      } catch (err) {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
    // send user to login; replace to avoid back button confusion
    navigate("/login", { replace: true });
  }

  function handleLoginSuccess(userObj, token) {
    // defensive: ensure token exists before saving
    if (token) localStorage.setItem("token", token);
    setUser(userObj || null);
    // go home after login
    navigate("/", { replace: true });
  }

  if (!ready) {
    // simple placeholder. Replace with spinner if you want.
    return null;
  }

  return (
    <AppRoutes
      user={user}
      onLogout={handleLogout}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}
