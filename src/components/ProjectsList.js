"use client";
import { useState } from "react";
import { deleteProject } from "../app/actions";
import styles from "../app/admin/admin.module.css";
import Toast from "./Toast";
import {
  getProjectArtistLabel,
  getProjectArtistRoleSummary,
} from "../lib/projectArtists";

export default function ProjectsList({ initialProjects = [] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function handleDeleteProject(id) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteProject(id);
      setSuccess("Project deleted successfully!");
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      setError(err?.message || "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className={styles.listPanel}>
        <h2>Current Projects ({projects.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {projects.map((project) => (
            <div key={project.id} className={styles.projectCard}>
              <div className={styles.projectInfo}>
                <h3 style={{ fontSize: "1rem" }}>{project.title}</h3>
                <p>
                  {Array.isArray(project.categories)
                    ? project.categories.join(", ")
                    : project.category}{" "}
                  | {getProjectArtistLabel(project) || "Unknown artists"}
                </p>
                {Array.isArray(project.subcategories) &&
                  project.subcategories.length > 0 && (
                    <p style={{ fontSize: "0.8rem", marginTop: "0.35rem" }}>
                      Subcategories: {project.subcategories.join(", ")}
                    </p>
                  )}
                {Array.isArray(project.artistRoles) &&
                  project.artistRoles.length > 0 && (
                    <p style={{ fontSize: "0.8rem", marginTop: "0.35rem" }}>
                      Artist Roles:{" "}
                      {getProjectArtistRoleSummary(project).join(" | ")}
                    </p>
                  )}
                {project.videoUrl && (
                  <span style={{ fontSize: "0.7rem", color: "#0f0" }}>
                    ● Video Included
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className={styles.deleteButton}
                  disabled={deletingId === project.id}
                  style={{
                    opacity: deletingId === project.id ? 0.6 : 1,
                    cursor:
                      deletingId === project.id ? "not-allowed" : "pointer",
                  }}
                >
                  {deletingId === project.id ? "Deleting..." : "Delete"}
                </button>
                <a
                  href={`/admin/edit/${project.id}`}
                  className={styles.editButton}
                  style={{
                    pointerEvents: deletingId ? "none" : "auto",
                    opacity: deletingId ? 0.6 : 1,
                  }}
                >
                  Edit
                </a>
              </div>
            </div>
          ))}
        </div>
        {projects.length === 0 && (
          <p style={{ color: "#888" }}>No projects have been added yet.</p>
        )}
      </div>

      {success && (
        <Toast
          message={success}
          type="success"
          duration={3000}
          onClose={() => setSuccess(null)}
        />
      )}
      {error && (
        <Toast
          message={error}
          type="error"
          duration={5000}
          onClose={() => setError(null)}
        />
      )}
    </>
  );
}
