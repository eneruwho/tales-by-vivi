"use client";
import { useRef, useState } from "react";
import { updateShowreel } from "../app/actions";
import styles from "../app/admin/admin.module.css";
import Toast from "./Toast";
import Loader from "./Loader";

const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudinaryUploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

async function uploadVideoToCloudinary(file) {
  // Use server-side signed upload to Cloudinary to avoid unsigned preset issues.
  const uploadData = new FormData();
  uploadData.append("file", file);
  uploadData.append("folder", "showreels");

  const response = await fetch(`/api/cloudinary-upload-file`, {
    method: "POST",
    body: uploadData,
  });

  const result = await response.json();
  if (!response.ok || !result?.success) {
    throw new Error(result?.error || "Cloudinary upload failed");
  }

  const secure = result?.result?.secure_url || result?.result?.url;
  if (!secure) throw new Error("Cloudinary did not return an upload URL");
  return secure;
}

export default function ShowreelForm() {
  const formRef = useRef(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData) {
    setError(null);
    setSuccess(null);

    const showreelUrl = formData.get("showreelUrl");
    const hasShowreelUrl =
      typeof showreelUrl === "string" && showreelUrl.trim().length > 0;
    const showreelVideo = formData.get("showreelVideo");
    const hasShowreelVideo =
      showreelVideo &&
      typeof showreelVideo === "object" &&
      typeof showreelVideo.arrayBuffer === "function" &&
      showreelVideo.size > 0;

    if (!hasShowreelUrl && !hasShowreelVideo) {
      setError("Please add a showreel URL or upload a video before saving.");
      return;
    }

    setLoading(true);
    try {
      const resolvedShowreelUrl = hasShowreelUrl
        ? showreelUrl.trim()
        : await uploadVideoToCloudinary(showreelVideo);

      const saveData = new FormData();
      saveData.set("showreelUrl", resolvedShowreelUrl);
      await updateShowreel(saveData);
      setSuccess("Showreel updated successfully!");
      setTimeout(() => {
        const form = formRef.current;
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
      <div
        className={styles.formPanel}
        style={{ position: "relative" }}
        aria-busy={loading}
      >
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
            <Loader text="Updating showreel..." />
          </div>
        )}
        <form action={handleSubmit} ref={formRef}>
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
          <button
            type="submit"
            className={styles.button}
            disabled={loading}
            aria-disabled={loading}
          >
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
