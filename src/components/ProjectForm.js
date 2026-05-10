"use client";
import { useRef, useState } from "react";
import { addProject } from "../app/actions";
import styles from "../app/admin/admin.module.css";
import ArtistSelect from "./ArtistSelect";
import Toast from "./Toast";
import Loader from "./Loader";

export default function ProjectForm({ artists }) {
  const formRef = useRef(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData) {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await addProject(formData);
      setSuccess("Project added successfully!");
      // Reset form after 2 seconds
      setTimeout(() => {
        const form = formRef.current;
        if (form) form.reset();
      }, 2000);
    } catch (err) {
      setError(err?.message || "Failed to add project");
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
        <h2>Add New Project</h2>
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
              background: "rgba(255,255,255,0.85)",
              zIndex: 20,
              borderRadius: "8px",
            }}
            aria-hidden={false}
          >
            <Loader text="Adding project..." />
          </div>
        )}
        <form action={handleSubmit} ref={formRef}>
          <div className={styles.inputGroup}>
            <label>Title</label>
            <input
              type="text"
              name="title"
              required
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Slug (Optional - auto-generated)</label>
            <input
              type="text"
              name="slug"
              className={styles.input}
              placeholder="my-awesome-project"
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Categories (comma-separated)</label>
            <input
              type="text"
              name="categories"
              required
              placeholder="e.g. Set Design, CGI, Photography"
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Subcategories (comma-separated)</label>
            <input
              type="text"
              name="subcategories"
              placeholder="e.g. Neon, Editorial, Abstract"
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Artist</label>
            <ArtistSelect artists={artists} />
          </div>

          <div className={styles.inputGroup}>
            <label>Artist Roles (comma-separated)</label>
            <input
              type="text"
              name="artistRoles"
              placeholder="e.g. Direction, Animation, Compositing"
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Preview Image (for website display)</label>
            <input
              type="file"
              name="previewImage"
              accept="image/*"
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Video URL (Optional link)</label>
            <input
              type="url"
              name="videoUrl"
              placeholder="https://..."
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>YouTube Link (opens in new tab)</label>
            <input
              type="url"
              name="youtubeUrl"
              placeholder="https://youtube.com/watch?v=..."
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Description (Optional)</label>
            <textarea
              name="description"
              className={styles.textarea}
              disabled={loading}
            ></textarea>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Adding Project..." : "Add Project"}
          </button>
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
