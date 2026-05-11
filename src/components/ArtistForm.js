"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { addArtist, deleteArtist } from "../app/actions";
import styles from "../app/admin/admin.module.css";
import ArtistEditInline from "./ArtistEditInline";
import Toast from "./Toast";
import Loader from "./Loader";

export default function ArtistForm({ initialArtists = [], onSaved }) {
  const formRef = useRef(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [artists, setArtists] = useState(initialArtists);
  const [artistPreviewSrc, setArtistPreviewSrc] = useState(null);

  async function handleAddArtist(formData) {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      // If an image file is present, upload it first to ensure success
      const artistFile = formData.get("artistImage");
      if (artistFile && artistFile.size > 0) {
        const fd = new FormData();
        fd.append("file", artistFile);
        fd.append("folder", "artists");
        const up = await fetch("/api/cloudinary-upload-file", {
          method: "POST",
          body: fd,
        });
        const upJson = await up.json();
        if (!up.ok || upJson?.error) {
          throw new Error(upJson?.error || "Failed to upload artist image");
        }
        const imgUrl = upJson.result?.secure_url || upJson.result?.url || null;
        if (imgUrl) {
          formData.set("imageUrl", imgUrl);
          formData.delete("artistImage");
        }
      }

      const created = await addArtist(formData);
      setSuccess("Artist added successfully!");
      if (created) setArtists((prev) => [...prev, created]);
      if (created && onSaved) onSaved(created);
      setTimeout(() => {
        const form = formRef.current;
        if (form) form.reset();
      }, 2000);
    } catch (err) {
      setError(err?.message || "Failed to add artist");
    } finally {
      setLoading(false);
    }
  }

  function handleArtistImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setArtistPreviewSrc(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setArtistPreviewSrc(null);
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
      <div
        className={styles.formPanel}
        style={{ position: "relative" }}
        aria-busy={loading}
      >
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
            <Loader text="Adding artist..." />
          </div>
        )}
        <form action={handleAddArtist} ref={formRef}>
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
            <label>Instagram Link</label>
            <input
              type="url"
              name="instagramUrl"
              placeholder="https://instagram.com/..."
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
              onChange={handleArtistImageChange}
            />
            {artistPreviewSrc && (
              <div style={{ marginTop: "0.5rem" }}>
                <Image
                  src={artistPreviewSrc}
                  alt="Artist thumbnail"
                  width={120}
                  height={120}
                  style={{
                    objectFit: "cover",
                    borderRadius: 6,
                    border: "1px solid #ddd",
                  }}
                  unoptimized
                />
              </div>
            )}
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
