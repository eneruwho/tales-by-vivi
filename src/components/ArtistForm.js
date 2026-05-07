"use client";
import { useState } from "react";
import { addArtist, deleteArtist } from "../app/actions";
import styles from "../app/admin/admin.module.css";
import ArtistEditInline from "./ArtistEditInline";
import Toast from "./Toast";
import Loader from "./Loader";

export default function ArtistForm({ initialArtists = [] }) {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [artists, setArtists] = useState(initialArtists);

  async function handleAddArtist(formData) {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await addArtist(formData);
      setSuccess("Artist added successfully!");
      setTimeout(() => {
        const form = event.target;
        if (form) form.reset();
      }, 2000);
    } catch (err) {
      setError(err?.message || "Failed to add artist");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteArtist(id) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteArtist(id);
      setSuccess("Artist deleted successfully!");
      setArtists(artists.filter((a) => a.id !== id));
    } catch (err) {
      setError(err?.message || "Failed to delete artist");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className={styles.formPanel}>
        <h2>Add New Artist</h2>
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
        {loading && <Loader text="Adding artist..." />}
        <form action={handleAddArtist}>
          <div className={styles.inputGroup}>
            <label>Artist Name</label>
            <input
              type="text"
              name="name"
              required
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Artist Slogan</label>
            <input
              type="text"
              name="slogan"
              placeholder="Simply Better Than Reality"
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Biography</label>
            <textarea
              name="bio"
              className={styles.textarea}
              placeholder="Madrid-Based CGI Studio..."
              disabled={loading}
            ></textarea>
          </div>

          <div className={styles.inputGroup}>
            <label>Artist Profile Image URL</label>
            <input
              type="url"
              name="imageUrl"
              placeholder="https://..."
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Artist Profile Image Upload</label>
            <input
              type="file"
              name="artistImage"
              accept="image/*"
              className={styles.input}
              disabled={loading}
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Adding Artist..." : "Add Artist"}
          </button>
        </form>

        <div style={{ marginTop: "2rem" }}>
          <h3>Artists List ({artists.length})</h3>
          <div
            className={styles.artistList}
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              marginTop: "1rem",
            }}
          >
            {artists.map((a) => (
              <div key={a.id} className={styles.artistCard}>
                <div>
                  <div className={styles.artistName}>{a.name}</div>
                  <div className={styles.artistSlug}>{a.slug}</div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <button
                    onClick={() => handleDeleteArtist(a.id)}
                    className={styles.deleteButton}
                    disabled={deletingId === a.id}
                    style={{
                      opacity: deletingId === a.id ? 0.6 : 1,
                      cursor: deletingId === a.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {deletingId === a.id ? "Deleting..." : "Delete"}
                  </button>
                  <ArtistEditInline artist={a} />
                </div>
              </div>
            ))}
          </div>
        </div>
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
