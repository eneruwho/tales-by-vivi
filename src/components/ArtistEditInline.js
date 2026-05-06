"use client";
import { useState } from "react";
import styles from "../app/admin/admin.module.css";

export default function ArtistEditInline({ artist, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(artist.name);
  const [slug, setSlug] = useState(artist.slug);
  const [imageUrl, setImageUrl] = useState(artist.imageUrl || "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch("/api/update-artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: artist.id, name, slug, imageUrl }),
      });
      const json = await res.json();
      if (json?.artist) {
        window.dispatchEvent(new Event("artists:changed"));
        setEditing(false);
        if (onSaved) onSaved(json.artist);
      } else {
        alert("Could not update artist: " + (json?.error || "unknown"));
      }
    } catch (err) {
      alert("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={styles.editButton}
        >
          Edit
        </button>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={styles.input}
          />
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className={styles.input}
            placeholder="Profile image URL"
          />
          <button onClick={save} disabled={loading} className={styles.button}>
            {loading ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className={styles.deleteButton}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
