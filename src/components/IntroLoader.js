"use client";
import { useEffect, useState, useRef } from "react";

export default function IntroLoader({ videoSrc = "/intro_video.mp4" }) {
  const [phase, setPhase] = useState("playing");
  const exitTimerRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const shouldSkip = window.matchMedia(
      "(pointer: coarse), (prefers-reduced-motion: reduce), (prefers-reduced-data: reduce)",
    ).matches;
    if (shouldSkip) {
      return undefined;
    }

    // Lock scroll while intro plays
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Fallback: if the video fails to load or play within 6 seconds, exit
    fallbackTimerRef.current = setTimeout(() => {
      if (!hasStartedRef.current) {
        setPhase("exiting");
      }
    }, 6000);

    return () => {
      document.body.style.overflow = prevOverflow || "";
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === "exiting") {
      const t = setTimeout(() => setPhase("done"), 900);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleVideoPlay = () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Clear fallback timer since video successfully started playing
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
    }

    // Show the intro animation for exactly 3 seconds, then exit
    exitTimerRef.current = setTimeout(() => {
      setPhase("exiting");
    }, 3000);
  };

  if (phase === "done") return null;

  return (
    <div
      className="introLoader"
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
        preload="metadata"
        poster="/logo.png"
        onPlay={handleVideoPlay}
        onPlaying={handleVideoPlay}
        onEnded={() => setPhase("exiting")}
      />
    </div>
  );
}
