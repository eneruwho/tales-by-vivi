"use client";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import ClientsMarquee from "../components/ClientsMarquee";
import InstagramEmbed from "../components/InstagramEmbed";
import { getProjectArtistLabel } from "../lib/projectArtists";
import IntroLoader from "../components/IntroLoader";
import { optimizeImageUrl, optimizeVideoUrl } from "../lib/media";
import styles from "./page.module.css";

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_IMAGE = "/logo.png";
const FALLBACK_VIDEO = "/intro_video.mp4";

// Cursor trail hover effect removed per request.

// ─── Category Row ───
function CategoryRow({ name, count, img }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/projects?category=${encodeURIComponent(name)}`}
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
          src={optimizeImageUrl(img, 900)}
          alt={name}
          className={styles.catRevealImg}
          fill
          sizes="(max-width: 768px) 90vw, 45vw"
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
  const heroWheelLockRef = useRef(false);
  const lastFamilyIdxRef = useRef(-1);
  const [activeFamilyIdx, setActiveFamilyIdx] = useState(0);
  const [activeReelIdx, setActiveReelIdx] = useState(0);
  const [showreelCopyStep, setShowreelCopyStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [currentYear] = useState(() => String(new Date().getFullYear()));
  const lenis = useLenis();

  const familyArtists = Array.isArray(artists) ? artists : [];
  const featuredProjects = projects.slice(0, 5);
  const activeProject =
    featuredProjects[activeReelIdx] || featuredProjects[0] || null;
  const activeProjectMediaType =
    activeProject?.mediaType ||
    (activeProject?.instagramUrl ? "instagram" : null);
  const activeArtist = familyArtists[activeFamilyIdx] || null;
  // trailImages was used for a cursor-trail hover effect that has been removed.
  const categoryImages = projects.reduce((acc, project) => {
    const cats = Array.isArray(project.categories) ? project.categories : [];
    const img = project.previewImageUrl || project.imageUrl;
    cats.forEach((cat) => {
      if (cat && img && !acc[cat]) {
        acc[cat] = img;
      }
    });
    return acc;
  }, {});

  // Resolve a safe embed URL for a video link (YouTube / Vimeo). Return null if not an embed.
  function resolveEmbedUrl(url) {
    if (!url) return null;
    const s = String(url).trim();
    const lower = s.toLowerCase();

    // YouTube patterns
    if (lower.includes("youtube") || lower.includes("youtu.be")) {
      // try to extract a video id from common URL forms
      const idMatch = s.match(
        /(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
      );
      const id = idMatch ? idMatch[1] : null;
      if (id)
        return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
    }

    // Vimeo pattern
    if (lower.includes("vimeo")) {
      const m = s.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}`;
    }

    return null;
  }

  // Category counts from projects + defaults
  const catCounts = projects.reduce((acc, p) => {
    const cats = Array.isArray(p.categories) ? p.categories : [];
    cats.forEach((cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
    });
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
    // Use a computed property so the current year string becomes the category name
    [currentYear]: 1,
    AI: 13,
  };
  const categories =
    Object.keys(catCounts).length > 0 ? catCounts : defaultCategories;

  useEffect(() => {
    if (isMobile) return undefined;
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
  }, [isMobile]);

  useEffect(() => {
    if (isMobile || !lenis || !showreelRef.current) return;

    const handleWheel = (event) => {
      const section = showreelRef.current;
      if (!section) return;

      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const sectionBottom = sectionTop + window.innerHeight;
      const currentScroll = window.scrollY;
      const isInHero =
        currentScroll >= sectionTop - 8 && currentScroll <= sectionBottom + 8;

      if (!isInHero || heroWheelLockRef.current) return;

      const direction = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0;
      if (direction === 0) return;

      const nextStep =
        direction > 0
          ? Math.min(1, showreelCopyStep + 1)
          : Math.max(0, showreelCopyStep - 1);
      if (nextStep === showreelCopyStep) return;

      event.preventDefault();
      heroWheelLockRef.current = true;

      lenis.scrollTo(sectionTop + window.innerHeight * nextStep, {
        duration: 0.55,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        lock: true,
      });

      // update step immediately so UI and logic can respond while scroll animation runs
      setShowreelCopyStep(nextStep);

      window.setTimeout(() => {
        heroWheelLockRef.current = false;
      }, 650);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isMobile, lenis, showreelCopyStep]);

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
    if (isMobile || !familyRef.current || familyArtists.length === 0) return;

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
  }, [familyArtists.length, isMobile]);

  

  return (
    <div className={styles.pageRoot} ref={containerRef}>
      <IntroLoader />

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
              src={optimizeImageUrl(activeProject.imageUrl || FALLBACK_IMAGE, 1600)}
              alt=""
              className={styles.pageBgImg}
              fill
              sizes="100vw"
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
                sizes="100vw"
                style={{ width: "100%", height: "auto" }}
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
                sizes="(max-width: 768px) 90vw, 45vw"
                style={{ width: "100%", height: "auto" }}
              />
                    <Link
                      href="/artists"
                      className={styles.showreelCopyCta}
                      data-cursor="hover"
                      prefetch
                    >
                      Explore our work
                      <span className={styles.heroBtnSquare} />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={styles.showreelMeta} aria-hidden={false}>
              <div>
                <div className={styles.showreelTitle}>Showreel</div>
                <div className={styles.showreelDates}>{currentYear}</div>
              </div>
            </div>

            <motion.div ref={showreelVideoRef} className={styles.showreelVideo}>
              {isMobile ? (
                <Image
                  src={optimizeImageUrl(
                    activeProject?.imageUrl || FALLBACK_IMAGE,
                    720,
                  )}
                  alt=""
                  fill
                  sizes="100vw"
                  className={styles.showreelVid}
                />
              ) : (
                <video
                  src={optimizeVideoUrl(
                    showreelUrl || activeProject?.videoUrl || FALLBACK_VIDEO,
                    1280,
                  )}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className={styles.showreelVid}
                  poster={activeProject?.imageUrl || FALLBACK_IMAGE}
                />
              )}
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
                href="/projects"
                className={styles.categoriesViewAll}
                data-cursor="hover"
              >
                View All Categories →
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
          </div>
        </section>

        <ClientsMarquee logos={clientLogos} />

        {/* ══════════════════════════════════
            SECTION 3 — THE FAMILY
        ══════════════════════════════════ */}
        <section className={styles.familySection} ref={familyRef}>
          <div className={styles.familyInner}>
            <h2 className={styles.familyTitle}>Our Crew</h2>
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
                        src={optimizeImageUrl(
                          activeArtist.imageUrl ||
                            activeArtist.previewImageUrl ||
                            FALLBACK_IMAGE,
                          900,
                        )}
                        alt={activeArtist.name}
                        className={styles.familyMediaImg}
                        fill
                        sizes="(max-width: 768px) 92vw, 50vw"
                      />
                      <div className={styles.familyMediaOverlay}>
                        <div className={styles.familyMediaTitle}>
                          {activeArtist.name}
                        </div>
                      </div>
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
                        {getProjectArtistLabel(proj) || "Unknown artists"}
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
                      className={
                        activeProjectMediaType === "instagram"
                          ? styles.reelMediaInnerInstagram
                          : styles.reelMediaInner
                      }
                    >
                      {activeProjectMediaType === "instagram" ? (
                        <div className={styles.reelMediaInstagramFrame}>
                          <InstagramEmbed
                            url={activeProject.instagramUrl}
                            title={activeProject.title}
                            className={styles.reelInstagramEmbed}
                          />
                          <Link
                            href={`/projects/${activeProject.slug}`}
                            className={styles.reelMediaHitArea}
                            aria-label={`Open ${activeProject.title}`}
                            data-cursor="hover"
                          />
                        </div>
                      ) : (
                        <Link
                          href={`/projects/${activeProject.slug}`}
                          data-cursor="hover"
                        >
                          {/* Render only when we can resolve a safe embed URL; otherwise show preview image */}
                          {(() => {
                            const embedSrc = resolveEmbedUrl(
                              (activeProject &&
                                (activeProject.youtubeUrl ||
                                  activeProject.videoUrl)) ||
                                null,
                            );

                            if (embedSrc) {
                              return (
                                <iframe
                                  src={embedSrc}
                                  title="Video player"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  referrerPolicy="strict-origin-when-cross-origin"
                                  allowFullScreen
                                  className={styles.reelMedia}
                                />
                              );
                            }

                            return (
                              <div className={styles.reelMediaImageWrap}>
                                <Image
                                  src={optimizeImageUrl(
                                    activeProject.imageUrl ||
                                      activeProject.previewImageUrl ||
                                      FALLBACK_IMAGE,
                                    1200,
                                  )}
                                  alt={activeProject.title}
                                  className={styles.reelMedia}
                                  fill
                                  sizes="(max-width: 768px) 92vw, 55vw"
                                />
                                {/* overlay with subcategories on hover */}
                                <div
                                  className={styles.reelMediaOverlay}
                                  aria-hidden
                                >
                                  {(
                                    activeProject.subcategories ||
                                    activeProject.subcategory ||
                                    []
                                  )
                                    .toString()
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                    .slice(0, 6)
                                    .join(" • ")}
                                </div>
                              </div>
                            );
                          })()}
                        </Link>
                      )}
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
