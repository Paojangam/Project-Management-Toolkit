import React, { useEffect, useRef } from "react";
import "../styles/ProfileSidebar.css";

/* Simple inline SVG icons — small and accessible */
function IconUser() {
  return (
    <svg className="ps-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14z" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg className="ps-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M19.4 12.9a7.9 7.9 0 0 0 0-1.8l2.1-1.6-2-3.4-2.5.7a8.1 8.1 0 0 0-1.5-.9L15 2h-6l-.6 3.9c-.5.2-1 .5-1.5.9l-2.5-.7-2 3.4 2.1 1.6a7.9 7.9 0 0 0 0 1.8L1 14.5l2 3.4 2.5-.7c.5.4 1 .7 1.5.9L9 22h6l.6-3.9c.5-.2 1-.5 1.5-.9l2.5.7 2-3.4-2.1-1.6zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg className="ps-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
    </svg>
  );
}

export default function ProfileSidebar({ open = false, onClose = () => {}, user = {}, onNavigate = () => {}, onLogout = () => {} }) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // focus the panel for keyboard users
    panelRef.current?.focus();
  }, [open]);

  // Close if click outside the panel
  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }

  // Prevent body scroll when sidebar open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  const displayName = user?.name || user?.email || "Profile";

  return (
    <div
      className="ps-overlay"
      ref={overlayRef}
      onMouseDown={handleOverlayClick}
      role="presentation"
      aria-hidden={!open}
    >
      <aside
        className="ps-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label="Profile sidebar"
        onMouseDown={(e) => e.stopPropagation()} // prevent overlay handler firing when clicking inside
      >
        <div className="ps-header">
          <div className="ps-avatar">
            { (displayName[0] || "P").toUpperCase() }
          </div>
          <div className="ps-user">
            <div className="ps-name">{displayName}</div>
            <div className="ps-email">{user?.email ? user.email : ""}</div>
          </div>
        </div>

        <nav className="ps-nav" aria-label="Profile actions">
          <button
            className="ps-item"
            onClick={() => {
              onNavigate("account");
              onClose();
            }}
          >
            <IconUser />
            <span>Account settings</span>
          </button>

          <button
            className="ps-item"
            onClick={() => {
              onNavigate("profile");
              onClose();
            }}
          >
            <IconSettings />
            <span>Profile</span>
          </button>

          <div className="ps-divider" />

          <button
            className="ps-item ps-danger"
            onClick={() => {
              onLogout();
            }}
          >
            <IconLogout />
            <span>Log out</span>
          </button>
        </nav>
      </aside>
    </div>
  );
}
