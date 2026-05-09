"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./projectDetail.module.css";
import Link from "next/link";
import { X } from "lucide-react";

function buildMediaList(project) {
  const media = [];

  if (Array.isArray(project.videoUrls)) {
    project.videoUrls.forEach(
      (url) => url && media.push({ type: "video", url }),
    );
  }
  if (project.videoUrl) media.push({ type: "video", url: project.videoUrl });
  if (Array.isArray(project.imageUrls)) {
    project.imageUrls.forEach(
      (url) => url && media.push({ type: "image", url }),
    );
  }
  if (project.imageUrl) media.push({ type: "image", url: project.imageUrl });

  return media;
}

export default function ProjectDetailClient({ project }) {
  const containerRef = useRef(null);
  const mediaList = buildMediaList(project);

  // Use previewImageUrl as hero if available, otherwise use first media
  const heroImage = project.previewImageUrl || (mediaList[0]?.type === "image" ? mediaList[0].url : null);
  const heroVideo = mediaList[0]?.type === "video" ? mediaList[0].url : null;
  const galleryMedia = project.previewImageUrl ? mediaList : mediaList.slice(1);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.5, ease: "power3.out" },
    );
  }, []);

  const handleHeroClick = () => {
    if (project.youtubeUrl) {
      window.open(project.youtubeUrl, "_blank");
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <Link
        href={project.artistSlug ? `/artists/${project.artistSlug}` : "/"}
        className={styles.closeBtn}
        data-cursor="hover"
      >
        <X size={40} />
      </Link>

      <div className={styles.mediaContainer} style={project.youtubeUrl ? { cursor: "pointer" } : {}}>
        {heroVideo ? (
          <video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className={styles.fullVideo}
          />
        ) : heroImage ? (
          <img
            src={heroImage}
            alt={project.title}
            className={styles.fullImage}
            loading="lazy"
            onClick={handleHeroClick}
            style={project.youtubeUrl ? { cursor: "pointer" } : {}}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="100%" height="100%" fill="%23ddd"/><text x="50%" y="50%" font-family="Arial, Helvetica, sans-serif" font-size="36" fill="%23666" dominant-baseline="middle" text-anchor="middle">Image unavailable</text></svg>';
            }}
          />
        ) : null}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.artistName}>{project.artist}</span>
            <h1 className={styles.title}>{project.title}</h1>
          </div>
          <div className={styles.categories}>
            {project.category.split(",").map((cat, i) => (
              <span key={i} className={styles.categoryPill}>
                {cat.trim()}
              </span>
            ))}
          </div>
        </div>

        {project.description && (
          <div className={styles.description}>
            <p>{project.description}</p>
          </div>
        )}

        {galleryMedia.length > 0 && (
          <div className={styles.gallery}>
            {galleryMedia.map((media, index) => (
              <div key={`${media.type}-${index}`} className={styles.thumb}>
                {media.type === "video" ? (
                  <video
                    src={media.url}
                    controls
                    playsInline
                    className={styles.thumbVideo}
                  />
                ) : (
                  <img
                    src={media.url}
                    alt={`${project.title} ${index + 1}`}
                    className={styles.thumbImage}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
