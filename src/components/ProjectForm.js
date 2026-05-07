"use client";
import { useState } from "react";
import { addProject } from "../app/actions";
import styles from "../app/admin/admin.module.css";
import ArtistSelect from "./ArtistSelect";
import Toast from "./Toast";
import Loader from "./Loader";

export default function ProjectForm({ artists }) {
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
        const form = event.target;
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
      <div className={styles.formPanel}>
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
        {loading && <Loader text="Adding project..." />}
        <form action={handleSubmit}>
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
            <label>Category</label>
            <input
              type="text"
              name="category"
              required
              placeholder="e.g. Set Design"
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Artist</label>
            <ArtistSelect artists={artists} />
          </div>

          <div className={styles.inputGroup}>
            <label>Image URL</label>
            <input
              type="url"
              name="imageUrl"
              placeholder="https://..."
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Project Images Upload</label>
            <input
              type="file"
              name="projectImages"
              accept="image/*"
              multiple
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
            <label>Project Videos Upload</label>
            <input
              type="file"
              name="projectVideos"
              accept="video/*"
              multiple
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
