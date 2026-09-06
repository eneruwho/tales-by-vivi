"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./projectDetail.module.css";
import Link from "next/link";
import Image from "next/image";
import { optimizeImageUrl } from "../../../lib/media";
import { X } from "lucide-react";
import {
  getProjectExternalLabel,
  getProjectExternalUrl,
} from "../../../lib/externalProjectUrl";
import {
  getProjectArtistEntries,
  getProjectArtistLabel,
  getProjectArtistRoleSummary,
} from "../../../lib/projectArtists";

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
  const artistRoles = getProjectArtistRoleSummary(project);
  const externalUrl = getProjectExternalUrl(project);
  const externalLabel = getProjectExternalLabel(project);
  const heroImage = project.previewImageUrl || project.imageUrl;
  const projectArtists = getProjectArtistEntries(project);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.2, ease: "power3.out" },
    );
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Close / back */}
      <Link href="/projects" className={styles.closeBtn} data-cursor="hover">
        <X size={28} />
      </Link>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        {heroImage && (
          <Image
            src={optimizeImageUrl(heroImage, 1600)}
            alt={project.title}
            className={styles.heroBg}
            fill
            priority
            sizes="100vw"
          />
        )}
        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <div className={styles.artistRow}>
            {projectArtists.length > 0 ? (
              projectArtists.map((artist) => (
                <Link
                  key={artist.slug}
                  href={`/artists/${artist.slug}`}
                  className={styles.artistLink}
                  data-cursor="hover"
                >
                  {artist.name}
                </Link>
              ))
            ) : (
              <span className={styles.artistName}>
                {getProjectArtistLabel(project) || "Artists"}
              </span>
            )}
          </div>
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

          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBtn}
              data-cursor="hover"
            >
              {externalLabel}
              <span className={styles.ctaBtnSquare} />
            </a>
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
                    src={optimizeImageUrl(media.url, 1200)}
                    alt={`${project.title} ${i + 1}`}
                    className={styles.thumbImage}
                    fill
                    sizes="(max-width: 768px) 100vw, 70vw"
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
