import React, { useState, useEffect, useCallback } from "react";
import "../styles/Navbar.css";
import CreateProjectModal from "./CreateProjectModal";
import ProfileSidebar from "./ProfileSidebar";
import { api } from "../api";

export default function Navbar({ user, onNavigate = () => {}, onLogout = () => {} }) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  async function handleCreate(payload) {
    setCreateError("");
    setCreating(true);
    try {
      const created = await api.projects.create(payload);
      setShowCreate(false);

      const id = created?.id || created?._id;
      if (id) {
        onNavigate("project", { id });
      }

      return created;
    } catch (err) {
      setCreateError(err?.message || "Failed to create project");
      throw err;
    } finally {
      setCreating(false);
    }
  }

  const handleKeyDown = useCallback(
    (e) => {
      if (showCreate) {
        if (e.key === "Escape" || e.key === "Esc") {
          if (!creating) {
            setShowCreate(false);
            setCreateError("");
          }
        }
      }

      if (showSidebar) {
        if (e.key === "Escape" || e.key === "Esc") {
          setShowSidebar(false);
        }
      }
    },
    [showCreate, creating, showSidebar]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <nav className="navbar">
        <div id="nav-spacer" aria-hidden="true"></div>
        <div className="nav-left">
          <div
            className="logo"
            role="button"
            tabIndex={0}
            onClick={() => onNavigate("homepage")}
            onKeyDown={(e) => e.key === "Enter" && onNavigate("homepage")}
          >
            <div className="mark" aria-hidden="true"></div>
            <div className="title">PM Tool</div>
          </div>
        </div>

        <div className="nav-right">
          <button
            className="btn btn-create"
            onClick={() => {
              setCreateError("");
              setShowCreate(true);
            }}
            disabled={creating}
          >
            + Create
          </button>

          {user ? (
            <>
              <button
                className="avatar avatar-btn"
                title={user.name || user.email}
                onClick={() => setShowSidebar(true)}
                aria-haspopup="dialog"
                aria-expanded={showSidebar}
              >
                {(user.name || user.email || "PK")[0].toUpperCase()}
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => onNavigate("login")}>Login</button>
            </>
          )}
        </div>
      </nav>

      {showCreate && (
        <div
          className="create-modal-catcher"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (!creating) {
                setShowCreate(false);
                setCreateError("");
              }
            }
          }}
          role="presentation"
        >
          <CreateProjectModal
            open={showCreate}
            onClose={() => {
              if (!creating) {
                setShowCreate(false);
                setCreateError("");
              }
            }}
            onCreate={async (payload) => {
              try {
                const created = await handleCreate(payload);
                return created;
              } catch (err) {
                throw err;
              }
            }}
          />
        </div>
      )}

      {createError && <div className="error-toast">{createError}</div>}

      {/* Profile Sidebar */}
      <ProfileSidebar
        open={showSidebar}
        onClose={() => setShowSidebar(false)}
        user={user}
        onNavigate={onNavigate}
        onLogout={() => {
          setShowSidebar(false);
          onLogout();
        }}
      />
    </>
  );
}
