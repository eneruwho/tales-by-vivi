"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        color: "inherit",
      }}
    >
      <h2 style={{ fontSize: "2rem", marginBottom: "1rem", fontWeight: 600 }}>
        Something went wrong
      </h2>
      <p style={{ maxWidth: "480px", opacity: 0.7, marginBottom: "2rem" }}>
        We encountered an unexpected error loading this page.
        {error?.digest && (
          <span style={{ display: "block", fontSize: "0.8rem", marginTop: "0.5rem" }}>
            Error Digest: {error.digest}
          </span>
        )}
      </p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={() => reset()}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "9999px",
            backgroundColor: "#fff",
            color: "#000",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
        <Link
          href="/"
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "9999px",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "inherit",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
