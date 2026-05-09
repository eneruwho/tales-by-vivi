"use client";
import { useState } from "react";
import styles from "../app/admin/admin.module.css";
import Loader from "./Loader";
import Toast from "./Toast";

export default function EditProjectForm({ project }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const form = e.currentTarget;
      const data = {
        id: project.id,
        title: form.title.value,
        slug: form.slug.value,
        category: form.category.value,
        imageUrl: form.imageUrl.value,
        videoUrl: form.videoUrl.value,
        description: form.description.value,
        artist: form.artist.value,
        artistSlug: form.artistSlug.value,
      };

      const res = await fetch("/api/update-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || json?.error) {
        throw new Error(json?.error || "Failed to update project");
      }
      setSuccess("Project updated successfully!");
    } catch (err) {
      setError(err?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className={styles.formPanel}
        style={{ position: "relative" }}
        aria-busy={loading}
      >
        <h2>Edit Project</h2>
        {error && (
          <div
            style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              backgroundColor: "#fee",
              color: "#c00",
              borderRadius: "4px",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.95)",
              zIndex: 40,
              borderRadius: "8px",
              flexDirection: "column",
            }}
            aria-hidden={false}
          >
            <div style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>
              Saving changes…
            </div>
            <Loader text="Saving…" />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Title</label>
            <input
              type="text"
              name="title"
              required
              defaultValue={project.title}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Slug (Optional)</label>
            <input
              type="text"
              name="slug"
              defaultValue={project.slug}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Category</label>
            <input
              type="text"
              name="category"
              required
              defaultValue={project.category}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Artist Name</label>
            <input
              type="text"
              name="artist"
              required
              defaultValue={project.artist}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Artist Slug (Optional)</label>
            <input
              type="text"
              name="artistSlug"
              defaultValue={project.artistSlug}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Image URL</label>
            <input
              type="url"
              name="imageUrl"
              defaultValue={project.imageUrl || ""}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Video URL (Optional)</label>
            <input
              type="url"
              name="videoUrl"
              defaultValue={project.videoUrl || ""}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Description (Optional)</label>
            <textarea
              name="description"
              className={styles.textarea}
              defaultValue={project.description || ""}
              disabled={loading}
            ></textarea>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
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
