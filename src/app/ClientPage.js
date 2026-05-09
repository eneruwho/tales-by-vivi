"use client";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import ClientsMarquee from "../components/ClientsMarquee";
import styles from "./page.module.css";

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_IMAGE = "/logo.png";
const FALLBACK_VIDEO = "/intro_video.mp4";

// ─── Cursor Trail ───
function CursorTrail({ containerRef, images = [] }) {
  const trailRef = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const idx = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = Math.abs(x - lastPos.current.x);
      const dy = Math.abs(y - lastPos.current.y);
      if (dx + dy < 60) return;
      lastPos.current = { x, y };

      const pool = trailRef.current?.querySelectorAll("[data-trail-img]");
      if (!pool || pool.length === 0) return;
      const img = pool[idx.current % pool.length];
      idx.current++;

      img.style.left = `${x - 60}px`;
      img.style.top = `${y - 60}px`;
      gsap.killTweensOf(img);
      gsap.fromTo(
        img,
        { opacity: 0, scale: 0.7, rotate: (Math.random() - 0.5) * 20 },
        {
          opacity: 1,
          scale: 1,
          rotate: 0,
          duration: 0.4,
          ease: "power3.out",
          onComplete: () => {
            gsap.to(img, {
              opacity: 0,
              duration: 0.6,
              delay: 0.5,
              ease: "power2.in",
            });
          },
        },
      );
    };

    container.addEventListener("mousemove", handleMove);
    return () => container.removeEventListener("mousemove", handleMove);
  }, [containerRef]);

  return (
    <div ref={trailRef} className={styles.trailContainer}>
      {images.map((src, i) => (
        <Image
          key={i}
          src={src}
          alt=""
          data-trail-img
          className={styles.trailImg}
          draggable={false}
          width={120}
          height={120}
          unoptimized
        />
      ))}
    </div>
  );
}

// ─── Category Row ───
function CategoryRow({ name, count, img }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/categories?filter=${encodeURIComponent(name)}`}
      className={styles.catRow}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-cursor="hover"
    >
      <div className={styles.catRowContent}>
        <span className={styles.catName}>{name}</span>
        <div className={styles.catCount}>
          <span>{count}</span>
        </div>
      </div>

      {/* Immersive hover reveal strip */}
      <motion.div
        className={styles.catReveal}
        initial={{ clipPath: "inset(0 0 100% round 10px)" }}
        animate={
          hovered
            ? { clipPath: "inset(0 0 0% round 10px)" }
            : { clipPath: "inset(0 0 100% round 10px)" }
        }
        transition={{ duration: 0.7, ease: [0.165, 0.84, 0.44, 1] }}
      >
        <Image
          src={img}
          alt={name}
          className={styles.catRevealImg}
          fill
          unoptimized
        />
        <div className={styles.catRevealOverlay}>
          <span className={styles.catRevealName}>{name}</span>
          <span className={styles.catRevealArrow}>→</span>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Main Client Page ───
export default function ClientPage({
  projects,
  artists = [],
  showreelUrl = null,
  clientLogos = [],
}) {
  const familyRef = useRef(null);
  const showreelRef = useRef(null);
  const showreelVideoRef = useRef(null);
  const showreelOverlayRef = useRef(null);
  const containerRef = useRef(null);
  const lastFamilyIdxRef = useRef(-1);
  const [activeFamilyIdx, setActiveFamilyIdx] = useState(0);
  const [activeReelIdx, setActiveReelIdx] = useState(0);
  const [showreelCopyStep, setShowreelCopyStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [introPhase, setIntroPhase] = useState("playing");

  const familyArtists = Array.isArray(artists) ? artists : [];
  const featuredProjects = projects.slice(0, 5);
  const activeProject =
    featuredProjects[activeReelIdx] || featuredProjects[0] || null;
  const activeArtist = familyArtists[activeFamilyIdx] || null;
  const activeArtistProjects = activeArtist
    ? projects
        .filter(
          (p) =>
            p.artistSlug === activeArtist.slug ||
            (p.artist || "")
              .toLowerCase()
              .includes(activeArtist.name.toLowerCase()),
        )
        .slice(0, 6)
    : [];
  const trailImages = projects
    .filter((project) => Boolean(project.imageUrl))
    .slice(0, 8)
    .map((project) => project.imageUrl);
  const categoryImages = projects.reduce((acc, project) => {
    if (project.category && project.imageUrl && !acc[project.category]) {
      acc[project.category] = project.imageUrl;
    }
    return acc;
  }, {});

  // Category counts from projects + defaults
  const catCounts = projects.reduce((acc, p) => {
    if (p.category) acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const defaultCategories = {
    Animation: 18,
    CGI: 12,
    Design: 9,
    "Motion Graphics": 14,
    Photography: 7,
    Luxury: 17,
    Characters: 26,
    AI: 13,
  };
  const categories =
    Object.keys(catCounts).length > 0 ? catCounts : defaultCategories;



  useEffect(() => {
    if (
      !showreelRef.current ||
      !showreelVideoRef.current ||
      !showreelOverlayRef.current
    )
      return;

    // Initialize video and overlay opacity
    gsap.set(showreelVideoRef.current, { opacity: 1 });
    gsap.set(showreelOverlayRef.current, { opacity: 0.2 });

    const trigger = ScrollTrigger.create({
      trigger: showreelRef.current,
      start: "top top",
      end: "+=100%",
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        const nextStep = p < 0.5 ? 0 : 1;
        setShowreelCopyStep((prev) => (prev === nextStep ? prev : nextStep));
      },
    });

    return () => trigger.kill();
  }, []);

  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const interval = setInterval(() => {
      setActiveFamilyIdx(
        (prev) => (prev + 1) % Math.max(familyArtists.length, 1),
      );
      setActiveReelIdx(
        (prev) => (prev + 1) % Math.max(featuredProjects.length, 1),
      );
    }, 2600);
    return () => clearInterval(interval);
  }, [isMobile, featuredProjects.length, familyArtists.length]);

  useEffect(() => {
    if (!familyRef.current || familyArtists.length === 0) return;

    const trigger = ScrollTrigger.create({
      trigger: familyRef.current,
      start: "top 65%",
      end: "bottom 35%",
      scrub: true,
      onUpdate: (self) => {
        const idx = Math.min(
          familyArtists.length - 1,
          Math.floor(self.progress * familyArtists.length),
        );
        if (idx !== lastFamilyIdxRef.current) {
          lastFamilyIdxRef.current = idx;
          setActiveFamilyIdx(idx);
        }
      },
    });

    return () => trigger.kill();
  }, [familyArtists.length]);

  useEffect(() => {
    if (introPhase !== "playing") return;

    // Safety timeout in case video ended doesn't fire on some browsers.
    const forceExit = setTimeout(() => {
      setIntroPhase((prev) => (prev === "playing" ? "exiting" : prev));
    }, 3000);

    return () => clearTimeout(forceExit);
  }, [introPhase]);

  useEffect(() => {
    if (introPhase !== "exiting") return;

    const complete = setTimeout(() => {
      setIntroPhase("done");
    }, 900);

    return () => clearTimeout(complete);
  }, [introPhase]);

  useEffect(() => {
    const shouldLockScroll = introPhase !== "done";
    const previousOverflow = document.body.style.overflow;

    if (shouldLockScroll) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [introPhase]);

  return (
    <div className={styles.pageRoot} ref={containerRef}>
      <AnimatePresence>
        {introPhase !== "done" && (
          <motion.div
            className={styles.introLoader}
            initial={{ opacity: 1, scale: 1 }}
            animate={
              introPhase === "exiting"
                ? { opacity: 0, scale: 1.08, filter: "blur(8px)" }
                : { opacity: 1, scale: 1, filter: "blur(0px)" }
            }
            exit={{ opacity: 0 }}
            transition={{
              duration: introPhase === "exiting" ? 0.9 : 0.45,
              ease: "easeInOut",
            }}
          >
            <motion.video
              src={FALLBACK_VIDEO}
              className={styles.introLoaderVideo}
              autoPlay
              muted
              playsInline
              preload="metadata"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              onEnded={() => {
                setIntroPhase((prev) =>
                  prev === "playing" ? "exiting" : prev,
                );
              }}
              onError={() => {
                setIntroPhase((prev) =>
                  prev === "playing" ? "exiting" : prev,
                );
              }}
            />
            <div className={styles.introLoaderOverlay} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FIXED FULL-PAGE BACKGROUND ── */}
      <AnimatePresence>
        {activeProject && (
          <motion.div
            key={activeProject.id}
            className={styles.pageBg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <Image
              src={activeProject.imageUrl || FALLBACK_IMAGE}
              alt=""
              className={styles.pageBgImg}
              fill
              unoptimized
            />
            <div className={styles.pageBgOverlay} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.pageFg}>
        {/* ══════════════════════════════════
            SECTION 1 — SHOWREEL HERO
        ══════════════════════════════════ */}

        <section className={styles.showreelSection} ref={showreelRef}>
          <motion.div
            className={styles.showreelInner}
            initial={{ opacity: 0, y: 70 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.showreelCopyWrap}>
              <AnimatePresence mode="wait">
                {showreelCopyStep === 0 ? (
                  <motion.div
                    key="showreel-copy-1"
                    className={styles.showreelCopyPanel}
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                    transition={{ duration: 0.42, ease: "easeOut" }}
                  >
                    <Image
                      src="/hero-heading1.png"
                      alt="Tales by VIVI"
                      className={`${styles.heroHeadingImg} ${styles.showreelHeadingMain}`}
                      width={1200}
                      height={260}
                      unoptimized
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="showreel-copy-2"
                    className={styles.showreelCopyPanel}
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                    transition={{ duration: 0.42, ease: "easeOut" }}
                  >
                    <Image
                      src="/hero-heading2.png"
                      alt="Chaos meets vision"
                      className={styles.heroHeadingImg}
                      width={1200}
                      height={220}
                      unoptimized
                    />
                    <Link
                      href="/artists"
                      className={styles.showreelCopyCta}
                      data-cursor="hover"
                    >
                      Explore our works
                      <span className={styles.heroBtnSquare} />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={styles.showreelMeta} aria-hidden={false}>
              <div>
                <div className={styles.showreelTitle}>Showreel</div>
                <div className={styles.showreelDates}>
                  {activeProject?.title || "Tales by VIVI"}
                </div>
              </div>
            </div>

            <motion.div ref={showreelVideoRef} className={styles.showreelVideo}>
              <video
                src={showreelUrl || activeProject?.videoUrl || FALLBACK_VIDEO}
                autoPlay
                loop
                muted
                playsInline
                className={styles.showreelVid}
                poster={activeProject?.imageUrl || FALLBACK_IMAGE}
              />
              <motion.div
                ref={showreelOverlayRef}
                className={styles.showreelVidOverlay}
              />
            </motion.div>

          </motion.div>
        </section>

        {/* ══════════════════════════════════
            SECTION 2 — CATEGORIES
        ══════════════════════════════════ */}
        <section className={styles.categoriesSection}>
          <div className={styles.categoriesInner}>
            <div className={styles.categoriesHead}>
              <h2 className={styles.categoriesTitle}>Categories</h2>
              <Link
                href="/categories"
                className={styles.categoriesViewAll}
                data-cursor="hover"
              >
                Explore All
              </Link>
            </div>
            <div className={styles.categoriesList}>
              {Object.entries(categories).map(([name, count]) => (
                <CategoryRow
                  key={name}
                  name={name}
                  count={count}
                  img={categoryImages[name] || FALLBACK_IMAGE}
                />
              ))}
            </div>
            <div className={styles.categoriesButton}>
              <Link
                href="/categories"
                className={styles.categoriesAllBtn}
                data-cursor="hover"
              >
                All Categories
                <span className={styles.heroBtnSquare} />
              </Link>
            </div>
          </div>
        </section>

        <ClientsMarquee logos={clientLogos} />

        {/* ══════════════════════════════════
            SECTION 3 — THE FAMILY
        ══════════════════════════════════ */}
        <section className={styles.familySection} ref={familyRef}>
          {!isMobile && (
            <CursorTrail containerRef={familyRef} images={trailImages} />
          )}
          <div className={styles.familyInner}>
            <h2 className={styles.familyTitle}>The Family</h2>
            <div className={styles.familyLayout}>
              {/* Left: media preview */}
              <div className={styles.familyMedia}>
                <AnimatePresence mode="wait">
                  {activeArtist && (
                    <motion.div
                      key={activeArtist.slug}
                      className={styles.familyMediaInner}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      <Image
                        src={
                          activeArtistProjects[0]?.imageUrl || FALLBACK_IMAGE
                        }
                        alt={activeArtist.name}
                        className={styles.familyMediaImg}
                        fill
                        unoptimized
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Right: name list */}
              <div className={styles.familyList}>
                {familyArtists.map((artist, i) => (
                  <div key={artist.slug} className={styles.familyItem}>
                    <Link
                      href={`/artists/${artist.slug}`}
                      className={`${styles.familyLink} ${activeFamilyIdx === i ? styles.familyLinkActive : ""}`}
                      onMouseEnter={() => setActiveFamilyIdx(i)}
                      onClick={() => setActiveFamilyIdx(i)}
                      data-cursor="hover"
                    >
                      {activeFamilyIdx === i && (
                        <motion.span
                          layoutId="family-active-dot"
                          className={styles.familyInlineDot}
                          transition={{
                            type: "spring",
                            stiffness: 520,
                            damping: 34,
                          }}
                        />
                      )}
                      {artist.name}
                    </Link>
                  </div>
                ))}
                <div className={styles.familyWorkPreview}>
                  <div className={styles.familyWorkTitle}>Selected Works</div>
                  <div className={styles.familyWorkList}>
                    {activeArtistProjects.length > 0 ? (
                      activeArtistProjects.map((project) => (
                        <Link
                          key={project.id}
                          href={`/projects/${project.slug}`}
                          className={styles.familyWorkItem}
                          data-cursor="hover"
                        >
                          <span>{project.title}</span>
                          <span className={styles.familyWorkArrow}>→</span>
                        </Link>
                      ))
                    ) : (
                      <p className={styles.familyWorkEmpty}>
                        No projects yet for this artist.
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href="/artists"
                  className={styles.familyViewAll}
                  data-cursor="hover"
                >
                  View All Artists →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            SECTION 4 — FEATURED PROJECTS REEL
        ══════════════════════════════════ */}
        <section className={styles.reelSection}>
          <div className={styles.reelInner}>
            <div className={styles.reelHead}>
              <h2 className={styles.reelTitle}>Latest Projects</h2>
              <Link
                href="/projects"
                className={styles.reelViewAll}
                data-cursor="hover"
              >
                View All
              </Link>
            </div>
            <div className={styles.reelLayout}>
              {/* Left: name list */}
              <ul className={styles.reelList}>
                {featuredProjects.map((proj, idx) => (
                  <li key={proj.id} className={styles.reelLi}>
                    {activeReelIdx === idx && (
                      <span className={styles.activeSquare} />
                    )}
                    <Link
                      href={`/projects/${proj.slug}`}
                      onMouseEnter={() => setActiveReelIdx(idx)}
                      className={`${styles.reelLink} ${activeReelIdx === idx ? styles.activeReelLink : ""}`}
                      data-cursor="hover"
                    >
                      <span className={styles.reelLinkTitle}>{proj.title}</span>
                      <span className={styles.artistLabel}>
                        {"// "}
                        {proj.artist}
                      </span>
                    </Link>
                  </li>
                ))}
                {featuredProjects.length === 0 && (
                  <li className={styles.reelEmpty}>
                    <span>
                      Add projects via <Link href="/admin">/admin</Link>
                    </span>
                  </li>
                )}
              </ul>

              {/* Center: media preview */}
              <div className={styles.reelMediaWrapper}>
                <AnimatePresence mode="wait">
                  {activeProject && (
                    <motion.div
                      key={activeProject.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className={styles.reelMediaInner}
                    >
                      <Link
                        href={`/projects/${activeProject.slug}`}
                        data-cursor="hover"
                      >
                        {activeProject.videoUrl ? (
                          <iframe
                            src={activeProject.videoUrl}
                            title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
                            className={styles.reelMedia}
                          />
                        ) : (
                          <Image
                            src={activeProject.imageUrl || FALLBACK_IMAGE}
                            alt={activeProject.title}
                            className={styles.reelMedia}
                            fill
                            unoptimized
                          />
                        )}
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* /pageFg */}
    </div>
  );
}
