// src/components/Navbar.jsx
import React, { useState, useEffect, useCallback } from "react";
import "../styles/Navbar.css";
import CreateProjectModal from "./CreateProjectModal";
import { api } from "../api";

export default function Navbar({ user, onNavigate = () => {}, onLogout = () => {} }) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function handleCreate(payload) {
    setCreateError("");
    setCreating(true);
    try {
      const created = await api.projects.create(payload);
      // close the modal
      setShowCreate(false);

      // navigate to the created project if backend returned an id
      const id = created?.id || created?._id;
      if (id) {
        // if your app expects a route name, you can adapt; here we try both
        onNavigate("project", { id });
      }

      return created;
    } catch (err) {
      setCreateError(err?.message || "Failed to create project");
      // rethrow so modal can also show errors if it expects exceptions
      throw err;
    } finally {
      setCreating(false);
    }
  }

  // Close modal on Escape key (but only when modal is open)
  const handleKeyDown = useCallback(
    (e) => {
      if (!showCreate) return;
      if (e.key === "Escape" || e.key === "Esc") {
        // don't close while creating
        if (!creating) {
          setShowCreate(false);
          setCreateError("");
        }
      }
    },
    [showCreate, creating]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // clicking the invisible backdrop will close the modal.
  // the <div className="create-modal-catcher"> is intentionally minimal:
  // it does not change your modal's look because it has no visual styles here.
  // If you later want a dim background, add styles to that class in your CSS.
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

          <div className="search" role="search">
            <input type="search" placeholder="Search" aria-label="Search" />
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

          <button className="btn btn-upgrade" onClick={() => onNavigate("plans")}>Upgrade</button>

          {user ? (
            <>
              <div className="avatar" title={user.name || user.email} onClick={() => onNavigate("profile")}>
                {(user.name || user.email || "PK")[0].toUpperCase()}
              </div>
              <button className="btn" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => onNavigate("login")}>Login</button>
            </>
          )}
        </div>
      </nav>

      {/* Modal: we render a click-catcher behind it which listens for outside clicks.
          We intentionally don't change any look or styles in your modal component.
          The catcher is non-visual by default (no background) so your appearance stays identical.
          If you prefer a dim overlay later, add CSS rules for .create-modal-catcher to style it. */}
      {showCreate && (
        <div
          // this wrapper catches clicks outside the modal content.
          // We keep styles out of this file to avoid changing appearance.
          className="create-modal-catcher"
          onClick={(e) => {
            // only trigger when user clicks on the catcher itself (outside the modal)
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

      {/* Optional inline error display if create fails */}
      {createError && (
        <div style={{ position: "fixed", right: 20, bottom: 20, background: "#fee2e2", padding: 10, borderRadius: 6, color: "#991b1b" }}>
          {createError}
        </div>
      )}
    </>
  );
}
