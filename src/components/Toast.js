"use client";
import { useState, useEffect } from "react";
import styles from "../app/admin/admin.module.css";

export default function Toast({
  message,
  type = "info",
  duration = 3000,
  onClose,
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColor =
    type === "success"
      ? "#dcffdc"
      : type === "error"
        ? "#ffe0e0"
        : type === "warning"
          ? "#fff3cd"
          : "#e0e7ff";

  const textColor =
    type === "success"
      ? "#0c6b0c"
      : type === "error"
        ? "#8b0000"
        : type === "warning"
          ? "#856404"
          : "#1e40af";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "1rem",
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        maxWidth: "400px",
        zIndex: 9999,
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(500px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span>
          {type === "success"
            ? "✓"
            : type === "error"
              ? "✕"
              : type === "warning"
                ? "⚠"
                : "ℹ"}
        </span>
        <span>{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          style={{
            marginLeft: "auto",
            border: "none",
            background: "none",
            color: "inherit",
            cursor: "pointer",
            fontSize: "1.2rem",
            padding: "0",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
