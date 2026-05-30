"use client";
import { useEffect, useState } from "react";

export default function IntroLoader({ videoSrc = "/intro_video.mp4" }) {
  const [phase, setPhase] = useState("playing");

  useEffect(() => {
    // Lock scroll while intro plays
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Play for 3 seconds, then start exiting transition
    const timer = setTimeout(() => {
      setPhase("exiting");
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow || "";
    };
  }, []);

  useEffect(() => {
    if (phase === "exiting") {
      const t = setTimeout(() => setPhase("done"), 900);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        background: "#fff",
        opacity: phase === "exiting" ? 0 : 1,
        transition: "opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1)",
        pointerEvents: phase === "playing" ? "all" : "none",
      }}
    >
      <video
        src={videoSrc}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        autoPlay
        muted
        playsInline
      />
    </div>
  );
}
