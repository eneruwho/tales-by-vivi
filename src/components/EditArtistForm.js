"use client";
import { useState } from "react";
import styles from "../app/admin/admin.module.css";
import Toast from "./Toast";

export default function EditArtistForm({ artist, onSaved }) {
  const [name, setName] = useState(artist.name || "");
  const [slug, setSlug] = useState(artist.slug || "");
  const [slogan, setSlogan] = useState(artist.slogan || "");
  const [instagramUrl, setInstagramUrl] = useState(artist.instagramUrl || "");
  const [bio, setBio] = useState(artist.bio || "");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch("/api/update-artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: artist.id,
          name,
          slug,
          slogan,
          instagramUrl,
          bio,
        }),
      });
      const json = await res.json();
      if (json?.artist) {
        setToast({ type: "success", message: "Artist updated" });
        if (onSaved) onSaved(json.artist);
      } else {
        throw new Error(json?.error || "Update failed");
      }
    } catch (err) {
      setToast({ type: "error", message: err?.message || "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Edit Artist</h2>
      <div className={styles.inputGroup}>
        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
        />
      </div>
      <div className={styles.inputGroup}>
        <label>Slug</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className={styles.input}
        />
      </div>
      <div className={styles.inputGroup}>
        <label>Slogan</label>
        <input
          value={slogan}
          onChange={(e) => setSlogan(e.target.value)}
          className={styles.input}
        />
      </div>
      <div className={styles.inputGroup}>
        <label>Instagram URL</label>
        <input
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          className={styles.input}
        />
      </div>
      <div className={styles.inputGroup}>
        <label>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={styles.textarea}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className={styles.button} onClick={save} disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
