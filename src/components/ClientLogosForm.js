"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { addClientLogos, removeClientLogo } from "../app/actions";
import styles from "../app/admin/admin.module.css";
import Toast from "./Toast";
import Loader from "./Loader";

function isUploadableFile(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.arrayBuffer === "function" &&
    value.size > 0
  );
}

export default function ClientLogosForm({ initialLogos = [] }) {
  const formRef = useRef(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [logos, setLogos] = useState(initialLogos);

  async function handleAddLogos(formData) {
    setError(null);
    setSuccess(null);

    const hasClientLogos = formData
      .getAll("clientLogos")
      .some(isUploadableFile);

    if (!hasClientLogos) {
      setError("Please upload at least one client logo before saving.");
      return;
    }

    setLoading(true);
    try {
      await addClientLogos(formData);
      setSuccess("Client logos added successfully!");
      setTimeout(() => {
        const form = formRef.current;
        if (form) form.reset();
      }, 2000);
    } catch (err) {
      setError(err?.message || "Failed to add client logos");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLogo(publicId) {
    setDeletingId(publicId);
    setError(null);
    try {
      await removeClientLogo(publicId);
      setSuccess("Client logo deleted successfully!");
      setLogos(logos.filter((logo) => logo.publicId !== publicId));
    } catch (err) {
      setError(err?.message || "Failed to delete logo");
    } finally {
      setDeletingId(null);
    }
  }

  const removableClientLogos = logos.filter(
    (logo) => logo.source === "cloudinary" && logo.publicId,
  );

  return (
    <>
      <div
        className={styles.formPanel}
        style={{ position: "relative" }}
        aria-busy={loading}
      >
        <h2>Client Logos</h2>
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
            <Loader text="Uploading logos..." />
          </div>
        )}
        <form action={handleAddLogos} ref={formRef}>
          <div className={styles.inputGroup}>
            <label>Upload Client Logos</label>
            <input
              type="file"
              name="clientLogos"
              accept="image/*"
              multiple
              className={styles.input}
              disabled={loading}
            />
          </div>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Adding..." : "Add Client Logos"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem" }}>
          <h3>Uploaded Client Logos ({removableClientLogos.length})</h3>
          <div className={styles.artistList} style={{ marginTop: "1rem" }}>
            {removableClientLogos.map((logo) => (
              <div key={logo.publicId} className={styles.artistCard}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <Image
                    src={logo.url}
                    alt="client logo"
                    width={72}
                    height={32}
                    style={{ objectFit: "contain" }}
                  />
                  <div>
                    <div className={styles.artistName}>Client logo</div>
                    <div className={styles.artistSlug}>{logo.publicId}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteLogo(logo.publicId)}
                  className={styles.deleteButton}
                  disabled={deletingId === logo.publicId}
                  style={{
                    opacity: deletingId === logo.publicId ? 0.6 : 1,
                    cursor:
                      deletingId === logo.publicId ? "not-allowed" : "pointer",
                  }}
                >
                  {deletingId === logo.publicId ? "Deleting..." : "Delete"}
                </button>
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
