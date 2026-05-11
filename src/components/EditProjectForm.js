"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "../app/admin/admin.module.css";
import ArtistSelect from "./ArtistSelect";
import Loader from "./Loader";
import Toast from "./Toast";

export default function EditProjectForm({ project, artists = [], onSaved }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [selectedArtists, setSelectedArtists] = useState(() => {
    // Parse existing artists from the project
    if (typeof project.artist === "string") {
      const names = project.artist.split(",").map((n) => n.trim());
      const slugs = (project.artistSlug || "").split(",").map((s) => s.trim());
      return names.map((name, idx) => ({
        name,
        slug: slugs[idx] || name.toLowerCase(),
      }));
    }
    return [];
  });
  const [mediaType, setMediaType] = useState(() => {
    if (project.instagramUrl) return "instagram";
    if (project.youtubeUrl) return "youtube";
    return "none";
  });
  const [previewSrc, setPreviewSrc] = useState(project.previewImageUrl || null);

  function formatCommaSeparatedValue(value) {
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "string") return value;
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const form = e.currentTarget;
      // If a new preview file was selected, upload it first
      let previewImageUrl =
        form.previewImageUrl?.value || project.previewImageUrl || null;
      const previewFile = form.previewImage?.files?.[0];
      if (previewFile && previewFile.size > 0) {
        const fd = new FormData();
        fd.append("file", previewFile);
        fd.append("folder", "project_preview");
        const up = await fetch("/api/cloudinary-upload-file", {
          method: "POST",
          body: fd,
        });
        const upJson = await up.json();
        if (!up.ok || upJson?.error) {
          throw new Error(upJson?.error || "Failed to upload preview image");
        }
        previewImageUrl =
          upJson.result?.secure_url || upJson.result?.url || previewImageUrl;
      }

      const data = {
        id: project.id,
        title: form.title.value,
        slug: form.slug.value,
        categories: form.categories.value,
        artistRoles: form.artistRoles.value,
        imageUrl: form.imageUrl.value,
        previewImageUrl,
        youtubeUrl: form.youtubeUrl?.value || null,
        instagramUrl: form.instagramUrl?.value || null,
        mediaType: mediaType || "none",
        description: form.description.value,
        artist:
          selectedArtists.length > 0
            ? selectedArtists.map((a) => a.name).join(", ")
            : form.artist.value,
        artistSlug:
          selectedArtists.length > 0
            ? selectedArtists.map((a) => a.slug).join(", ")
            : "",
      };

      // Client-side validation: require at least one project media source
      const providedImageUrl = String(data.imageUrl || "").trim();
      const providedYoutube = String(data.youtubeUrl || "").trim();
      const providedInstagram = String(data.instagramUrl || "").trim();
      if (!providedImageUrl && !providedYoutube && !providedInstagram) {
        throw new Error(
          "Please provide a project image URL or a YouTube or Instagram URL",
        );
      }

      // Media-type-specific validation
      if (data.mediaType === "youtube" && !providedYoutube) {
        throw new Error("YouTube URL is required when Media Type is YouTube");
      }
      if (data.mediaType === "instagram" && !providedInstagram) {
        throw new Error(
          "Instagram URL is required when Media Type is Instagram",
        );
      }

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
      if (json?.project && typeof onSaved === "function") onSaved(json.project);
    } catch (err) {
      setError(err?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  function handlePreviewInputChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewSrc(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewSrc(project.previewImageUrl || null);
    }
  }

  function handleAddArtist(artist) {
    if (!selectedArtists.find((a) => a.slug === artist.slug)) {
      setSelectedArtists([...selectedArtists, artist]);
    }
  }

  function handleRemoveArtist(slug) {
    setSelectedArtists(selectedArtists.filter((a) => a.slug !== slug));
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

        <form
          onSubmit={handleSubmit}
          style={{ columnCount: 2, columnGap: "2rem" }}
        >
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
            <label>Categories (comma-separated)</label>
            <input
              type="text"
              name="categories"
              required
              defaultValue={formatCommaSeparatedValue(
                project.categories || project.category,
              )}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Artists (Select multiple)</label>
            <div
              style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}
            >
              <div style={{ flex: 1 }}>
                <ArtistSelect
                  artists={artists}
                  defaultArtist=""
                  onSelect={(artist) => handleAddArtist(artist)}
                />
              </div>
            </div>
            {selectedArtists.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  marginTop: "0.75rem",
                }}
              >
                {selectedArtists.map((artist) => (
                  <div
                    key={artist.slug}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "#e0e0e0",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                      color: "#000",
                    }}
                  >
                    <span>{artist.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveArtist(artist.slug)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "0",
                        fontSize: "1rem",
                        color: "#666",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="hidden"
              name="artist"
              value={selectedArtists.map((a) => a.name).join(", ")}
            />
            <input
              type="hidden"
              name="artistSlug"
              value={selectedArtists.map((a) => a.slug).join(", ")}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Artist Roles (comma-separated)</label>
            <input
              type="text"
              name="artistRoles"
              defaultValue={formatCommaSeparatedValue(project.artistRoles)}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Preview Image (required)</label>
            <input
              type="file"
              name="previewImage"
              accept="image/*"
              className={styles.input}
              disabled={loading}
              onChange={handlePreviewInputChange}
            />
            {previewSrc ? (
              <div style={{ marginTop: "0.5rem" }}>
                <Image
                  src={previewSrc}
                  alt="Preview thumbnail"
                  width={160}
                  height={90}
                  style={{
                    objectFit: "cover",
                    borderRadius: 6,
                    border: "1px solid #ddd",
                  }}
                  unoptimized
                />
              </div>
            ) : (
              <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
                {project.previewImageUrl ? (
                  <a
                    href={project.previewImageUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Current preview image
                  </a>
                ) : (
                  "No preview image set"
                )}
              </div>
            )}
            <input
              type="hidden"
              name="previewImageUrl"
              value={project.previewImageUrl || ""}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Project Image URL (optional)</label>
            <input
              type="url"
              name="imageUrl"
              defaultValue={project.imageUrl || ""}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Media Type</label>
            <select
              name="mediaType"
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              className={styles.input}
              disabled={loading}
            >
              <option value="none">None</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          {mediaType === "youtube" && (
            <div className={styles.inputGroup}>
              <label>YouTube URL (Optional)</label>
              <input
                type="url"
                name="youtubeUrl"
                defaultValue={project.youtubeUrl || ""}
                className={styles.input}
                disabled={loading}
              />
            </div>
          )}

          {mediaType === "instagram" && (
            <div className={styles.inputGroup}>
              <label>Instagram URL (Optional)</label>
              <input
                type="url"
                name="instagramUrl"
                defaultValue={project.instagramUrl || ""}
                className={styles.input}
                disabled={loading}
              />
            </div>
          )}

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
