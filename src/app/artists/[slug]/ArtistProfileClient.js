"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import styles from "./artistDetail.module.css";
import Link from "next/link";
import Image from "next/image";
import {
  getProjectArtistEntries,
  buildProjectArtistSelections,
} from "../../../lib/projectArtists";
export default function ArtistProfileClient({ artist, projects }) {
  const heroRef = useRef(null);
  const gridRef = useRef(null);
  const placeholderImage =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="100%" height="100%" fill="%23111"/><text x="50%" y="50%" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="%23aaa" dominant-baseline="middle" text-anchor="middle">No profile image</text></svg>';

  function getProjectMediaType(project) {
    if (project?.mediaType) return project.mediaType;
    if (project?.instagramUrl) return "instagram";
    if (project?.youtubeUrl || project?.videoUrl) return "youtube";
    return null;
  }

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      heroRef.current.children,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.2,
        duration: 1,
        ease: "power3.out",
        delay: 0.8,
      },
    );

    gsap.fromTo(
      gridRef.current.children,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 80%",
        },
      },
    );
  }, []);

  return (
    <div className={styles.container}>
      <Link href="/artists" className={styles.backLink} data-cursor="hover">
        ← Back to Artists
      </Link>

      <section className={styles.hero} ref={heroRef}>
        <div className={styles.heroGrid}>
          <div className={styles.heroImage}>
            <Image
              src={
                artist.imageUrl || artist.previewImageUrl || placeholderImage
              }
              alt={artist.name}
              width={800}
              height={1000}
              style={{ objectFit: "cover" }}
              unoptimized
              onError={() => {}}
            />
          </div>
          <div>
            <h1 className={styles.name}>{artist.name}</h1>
            <p
              className={styles.slogan}
            >{`"${artist.slogan || "Simply Better Than Reality"}"`}</p>
            <p className={styles.bio}>{artist.bio}</p>
            {artist.instagramUrl && (
              <p className={styles.socialRow}>
                <a
                  href={artist.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.instagramLink}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ marginRight: 8 }}
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line>
                  </svg>
                  Instagram
                </a>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.projects}>
        <div className={styles.grid} ref={gridRef}>
          {projects.map((project) => {
            const mediaType = getProjectMediaType(project);
            const hasImage = Boolean(
              project.previewImageUrl || project.imageUrl,
            );
            const isInstagramOnly = Boolean(
              mediaType === "instagram" && !hasImage,
            );
            const linkHref = isInstagramOnly
              ? project.instagramUrl
              : `/projects/${project.slug}`;
            const external = isInstagramOnly;
            const projectArtists = getProjectArtistEntries(project);

            return (
              <Link
                key={project.id}
                href={linkHref}
                className={styles.card}
                data-cursor="hover"
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <div className={styles.mediaWrapper}>
                  {hasImage ? (
                    <Image
                      src={project.previewImageUrl || project.imageUrl}
                      alt={project.title}
                      className={styles.image}
                      width={1600}
                      height={900}
                      unoptimized
                    />
                  ) : isInstagramOnly ? (
                    <div className={styles.instagramPlaceholder} aria-hidden>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="48"
                          height="48"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="2"
                            y="2"
                            width="20"
                            height="20"
                            rx="5"
                            ry="5"
                          />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                        </svg>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                          }}
                        >
                          Instagram Post
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.noImagePlaceholder} aria-hidden>
                      <span>No image</span>
                    </div>
                  )}
                </div>
                <div className={styles.info}>
                  <h3>{project.title}</h3>
                  {/* Show roles for the current artist only */}
                  {(() => {
                    const selections = buildProjectArtistSelections(
                      project,
                      project.artists || [],
                    );
                    const sel = selections.find((s) => s.slug === artist.slug);
                    if (sel && sel.rolesText) {
                      return (
                        <div
                          style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}
                        >
                          <strong>Role:</strong> {sel.rolesText}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {projectArtists.length > 1 && (
                    <div className={styles.coArtistRow}>
                      {projectArtists.map((artist) => (
                        <span key={artist.slug} className={styles.coArtistText}>
                          {artist.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <span>
                    {Array.isArray(project.categories)
                      ? project.categories.join(", ")
                      : project.category || ""}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
