"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { addProject } from "../app/actions";
import styles from "../app/admin/admin.module.css";
import ArtistSelect from "./ArtistSelect";
import Toast from "./Toast";
import Loader from "./Loader";

export default function ProjectForm({ artists = [], onSaved }) {
  const formRef = useRef(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState([]); // Array of { name, slug }
  const [mediaType, setMediaType] = useState("youtube");
  const [previewSrc, setPreviewSrc] = useState(null);

  async function handleSubmit(formData) {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      // preview image is required for adds
      const previewFile = formData.get("previewImage");
      if (
        !previewFile ||
        (previewFile.size === 0 && previewFile.name === undefined)
      ) {
        throw new Error("Preview image is required");
      }

      // media-specific requirements on add
      if (mediaType === "youtube") {
        const y = String(formData.get("youtubeUrl") || "").trim();
        if (!y)
          throw new Error("YouTube URL is required when Media Type is YouTube");
      }
      if (mediaType === "instagram") {
        const ig = String(formData.get("instagramUrl") || "").trim();
        if (!ig)
          throw new Error(
            "Instagram URL is required when Media Type is Instagram",
          );
      }

      // Require at least one project media source (imageUrl or youtube or instagram)
      const providedImageUrl = String(formData.get("imageUrl") || "").trim();
      const providedYoutube = String(formData.get("youtubeUrl") || "").trim();
      const providedInstagram = String(
        formData.get("instagramUrl") || "",
      ).trim();
      if (!providedImageUrl && !providedYoutube && !providedInstagram) {
        throw new Error(
          "Please provide a project image URL or a YouTube or Instagram URL",
        );
      }

      if (selectedArtists.length === 0) {
        throw new Error("Please select at least one artist for this project");
      }

      // Upload preview image client-side and set previewImageUrl to ensure upload succeeds
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
        const previewUrl =
          upJson.result?.secure_url || upJson.result?.url || null;
        if (previewUrl) {
          formData.set("previewImageUrl", previewUrl);
          // remove the file so server action doesn't re-upload
          formData.delete("previewImage");
        }
      }

      const created = await addProject(formData);
      setSuccess("Project added successfully!");
      if (created && onSaved) onSaved(created);
      // Reset form after 2 seconds
      setTimeout(() => {
        const form = formRef.current;
        if (form) form.reset();
        setSelectedArtists([]);
        setPreviewSrc(null);
      }, 2000);
    } catch (err) {
      setError(err?.message || "Failed to add project");
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
      setPreviewSrc(null);
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
        <form
          action={handleSubmit}
          ref={formRef}
          style={{ columnCount: 2, columnGap: "2rem" }}
        >
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
            <label>Artists (Select multiple)</label>
            <div
              style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}
            >
              <div style={{ flex: 1 }}>
            <ArtistSelect
              artists={artists}
              defaultArtist=""
              includeHiddenFields={false}
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
            {selectedArtists.map((artist) => (
              <input
                key={artist.slug}
                type="hidden"
                name="artistSlugs"
                value={artist.slug}
              />
            ))}
          </div>

          <div className={styles.inputGroup}>
            <label>Preview Image (required)</label>
            <input
              type="file"
              name="previewImage"
              accept="image/*"
              className={styles.input}
              disabled={loading}
              required
              onChange={handlePreviewInputChange}
            />
            {previewSrc && (
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
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Project Image URL (optional)</label>
            <input
              type="url"
              name="imageUrl"
              placeholder="https://..."
              className={styles.input}
              disabled={loading}
            />
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
              <label>YouTube URL (required)</label>
              <input
                type="url"
                name="youtubeUrl"
                placeholder="https://youtube.com/watch?v=..."
                className={styles.input}
                disabled={loading}
                required
              />
            </div>
          )}

          {mediaType === "instagram" && (
            <div className={styles.inputGroup}>
              <label>Instagram URL (required)</label>
              <input
                type="url"
                name="instagramUrl"
                placeholder="https://www.instagram.com/p/..."
                className={styles.input}
                disabled={loading}
                required
              />
            </div>
          )}

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
