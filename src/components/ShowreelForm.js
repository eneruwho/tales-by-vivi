"use client";
import { useState } from "react";
import { updateShowreel } from "../app/actions";
import styles from "../app/admin/admin.module.css";
import Toast from "./Toast";
import Loader from "./Loader";

export default function ShowreelForm() {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData) {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await updateShowreel(formData);
      setSuccess("Showreel updated successfully!");
      setTimeout(() => {
        const form = event.target;
        if (form) form.reset();
      }, 2000);
    } catch (err) {
      setError(err?.message || "Failed to update showreel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className={styles.formPanel}>
        <h2>Showreel</h2>
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
        {loading && <Loader text="Updating showreel..." />}
        <form action={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Showreel URL</label>
            <input
              type="url"
              name="showreelUrl"
              placeholder="https://..."
              className={styles.input}
              disabled={loading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Upload Showreel Video</label>
            <input
              type="file"
              name="showreelVideo"
              accept="video/*"
              className={styles.input}
              disabled={loading}
            />
          </div>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Saving..." : "Save Showreel"}
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
