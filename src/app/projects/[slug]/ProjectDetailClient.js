"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./projectDetail.module.css";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";

function buildGallery(project) {
  const seen = new Set();
  const media = [];

  const add = (url, type = "image") => {
    if (url && !seen.has(url)) {
      seen.add(url);
      media.push({ type, url });
    }
  };

  if (Array.isArray(project.imageUrls))
    project.imageUrls.forEach((u) => add(u));
  add(project.imageUrl);

  // Exclude the hero preview from the gallery
  const heroUrl = project.previewImageUrl || project.imageUrl;
  return media.filter((m) => m.url !== heroUrl);
}

// The project will store the full YouTube embed URL in `project.youtubeUrl`
// (e.g. https://www.youtube.com/embed/VIDEO_ID). Use it directly.

export default function ProjectDetailClient({ project }) {
  const containerRef = useRef(null);

  const galleryMedia = buildGallery(project);
  const categories = Array.isArray(project.categories)
    ? project.categories
    : project.category
      ? project.category.split(",").map((c) => c.trim())
      : [];
  const subcategories = Array.isArray(project.subcategories)
    ? project.subcategories
    : [];
  const artistRoles = Array.isArray(project.artistRoles)
    ? project.artistRoles
    : [];
  // Normalize various YouTube URL formats into an embed URL
  function toYouTubeEmbed(url) {
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim();
    // Already an embed URL
    if (trimmed.includes("youtube.com/embed/")) return trimmed;
    // Standard watch URL
    const watchMatch = trimmed.match(/[?&]v=([\w-]{6,})/);
    if (watchMatch && watchMatch[1])
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    // Short youtu.be URL
    const shortMatch = trimmed.match(/youtu\.be\/([\w-]{6,})/);
    if (shortMatch && shortMatch[1])
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    // If it's just an ID
    if (/^[\w-]{6,}$/.test(trimmed))
      return `https://www.youtube.com/embed/${trimmed}`;
    return null;
  }

  // Try youtubeUrl first, fall back to videoUrl or the first videoUrls entry
  const youtubeEmbedUrl = toYouTubeEmbed(
    project.youtubeUrl ||
      project.videoUrl ||
      (Array.isArray(project.videoUrls) ? project.videoUrls[0] : null),
  );

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.2, ease: "power3.out" },
    );
    // Debug logs to help diagnose missing iframe in browser
    try {
      console.log(
        "ProjectDetailClient: project.youtubeUrl ->",
        project.youtubeUrl,
      );
      console.log("ProjectDetailClient: project.videoUrl ->", project.videoUrl);
      console.log(
        "ProjectDetailClient: project.videoUrls ->",
        project.videoUrls,
      );
      console.log("ProjectDetailClient: youtubeEmbedUrl ->", youtubeEmbedUrl);
    } catch (e) {
      // ignore
    }
  }, [
    project.videoUrl,
    project.videoUrls,
    project.youtubeUrl,
    youtubeEmbedUrl,
  ]);

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Close / back */}
      <Link
        href={
          project.artistSlug ? `/artists/${project.artistSlug}` : "/artists"
        }
        className={styles.closeBtn}
        data-cursor="hover"
      >
        <X size={28} />
      </Link>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        {youtubeEmbedUrl && (
          <iframe
            src={youtubeEmbedUrl}
            title={project.title}
            className={styles.heroVideo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <span className={styles.artistName}>{project.artist}</span>
          <h1 className={styles.title}>{project.title}</h1>

          {categories.length > 0 && (
            <div className={styles.categories}>
              {categories.map((cat, i) => (
                <span key={i} className={styles.categoryPill}>
                  {cat}
                </span>
              ))}
            </div>
          )}

          {subcategories.length > 0 && (
            <div className={styles.categories}>
              {subcategories.map((cat, i) => (
                <span key={`sub-${i}`} className={styles.categoryPill}>
                  {cat}
                </span>
              ))}
            </div>
          )}

          {artistRoles.length > 0 && (
            <div className={styles.categories}>
              {artistRoles.map((role, i) => (
                <span key={`role-${i}`} className={styles.categoryPill}>
                  {role}
                </span>
              ))}
            </div>
          )}

          {/* video already used as hero background; no inline duplicate */}
          {!youtubeEmbedUrl &&
            (project.youtubeUrl ||
              project.videoUrl ||
              (project.videoUrls && project.videoUrls[0])) && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.6rem 0.8rem",
                  background: "rgba(255,230,230,0.06)",
                  border: "1px solid rgba(255,100,100,0.08)",
                  color: "#ffdede",
                  borderRadius: 6,
                }}
              >
                Unable to render YouTube embed. Raw URLs:{" "}
                <span style={{ opacity: 0.9 }}>
                  {project.youtubeUrl ||
                    project.videoUrl ||
                    (project.videoUrls && project.videoUrls[0])}
                </span>
              </div>
            )}
        </div>
      </section>

      {/* ── BELOW HERO ── */}
      {(project.description || galleryMedia.length > 0) && (
        <section className={styles.content}>
          {project.description && (
            <p className={styles.description}>{project.description}</p>
          )}

          {galleryMedia.length > 0 && (
            <div className={styles.gallery}>
              {galleryMedia.map((media, i) => (
                <div key={i} className={styles.thumb}>
                  <Image
                    src={media.url}
                    alt={`${project.title} ${i + 1}`}
                    className={styles.thumbImage}
                    fill
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
