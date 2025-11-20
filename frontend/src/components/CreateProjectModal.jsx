// src/components/CreateProjectModal.jsx
import React, { useState } from "react";
import "../styles/CreateProjectModal.css";
import { api } from "../api";

export default function CreateProjectModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    members: "",
  });

  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);

  if (!open) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // simple validation
    if (!form.title.trim()) {
      setErr("Title is required");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      members: form.members
        ? form.members.split(",").map((m) => m.trim()).filter(Boolean)
        : [],
    };

    setErr("");
    setCreating(true);

    try {
      const created = await api.projects.create(payload);

      if (typeof onCreate === "function") {
        try {
          await onCreate(created);
        } catch (parentErr) {
          setErr(parentErr?.message || "Parent handler failed");
          setCreating(false);
          return;
        }
      }

      setForm({ title: "", description: "", startDate: "", endDate: "", members: "" });
      setCreating(false);
      onClose();
    } catch (e) {
      setErr(e?.message || "Failed to create project");
      setCreating(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Create Project">
        <div className="modal-header">
          <h3>Create Project</h3>
          <button
            className="close-btn"
            onClick={() => {
              // prevent closing while creating to avoid accidental cancellation
              if (!creating) {
                setErr("");
                onClose();
              }
            }}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <label>
            Title <span className="required">*</span>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              disabled={creating}
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              disabled={creating}
            />
          </label>

          <label>
            Start Date
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              disabled={creating}
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              disabled={creating}
            />
          </label>

          <label>
            Members (comma-separated user IDs)
            <input
              type="text"
              name="members"
              value={form.members}
              onChange={handleChange}
              placeholder="507f1f77bcf86cd799439011, 507f191e810c19729de860ea"
              disabled={creating}
            />
            <small className="field-hint">Enter MongoDB ObjectIds of users to add as members</small>
          </label>

          {err && <div className="error" role="alert">{err}</div>}

          <div className="modal-footer">
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                if (!creating) {
                  setErr("");
                  onClose();
                }
              }}
              disabled={creating}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
