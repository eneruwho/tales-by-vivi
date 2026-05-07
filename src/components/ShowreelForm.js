"use client";
import { useRef, useState } from "react";
import { updateShowreel } from "../app/actions";
import styles from "../app/admin/admin.module.css";
import Toast from "./Toast";
import Loader from "./Loader";

const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudinaryUploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

async function uploadVideoToCloudinary(file) {
  if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
    throw new Error(
      "Missing Cloudinary upload settings. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
    );
  }

  const uploadData = new FormData();
  uploadData.append("file", file);
  uploadData.append("upload_preset", cloudinaryUploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/video/upload`,
    {
      method: "POST",
      body: uploadData,
    },
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error?.message || "Cloudinary upload failed");
  }

  if (!result?.secure_url) {
    throw new Error("Cloudinary did not return an upload URL");
  }

  return result.secure_url;
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
