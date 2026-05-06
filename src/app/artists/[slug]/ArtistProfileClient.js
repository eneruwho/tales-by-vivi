"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./artistDetail.module.css";
import Link from "next/link";

export default function ArtistProfileClient({ artist, projects }) {
  const heroRef = useRef(null);
  const gridRef = useRef(null);
  const placeholderImage =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="100%" height="100%" fill="%23111"/><text x="50%" y="50%" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="%23aaa" dominant-baseline="middle" text-anchor="middle">No profile image</text></svg>';

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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px, 360px) 1fr",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          <div className={styles.heroImage}>
            <img
              src={artist.imageUrl || placeholderImage}
              alt={artist.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                aspectRatio: "4 / 5",
              }}
            />
          </div>
          <div>
            <h1 className={styles.name}>{artist.name}</h1>
            <p
              className={styles.slogan}
            >{`"${artist.slogan || "Simply Better Than Reality"}"`}</p>
            <p className={styles.bio}>{artist.bio}</p>
          </div>
        </div>
      </section>

      <section className={styles.projects}>
        <div className={styles.grid} ref={gridRef}>
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className={styles.card}
              data-cursor="hover"
            >
              <div className={styles.mediaWrapper}>
                {project.videoUrl ? (
                  <video
                    src={project.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className={styles.video}
                  />
                ) : (
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className={styles.image}
                  />
                )}
              </div>
              <div className={styles.info}>
                <h3>{project.title}</h3>
                <span>{project.category}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
