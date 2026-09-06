"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Image from "next/image";
import { optimizeImageUrl } from "../lib/media";
import styles from "../app/page.module.css";
import {
  createFallbackClientLogos,
  mergeClientLogos,
  normalizeClientLogoItems,
} from "../lib/clientLogos";

export default function ClientsMarquee({ logos = [] }) {
  const marqueeRef = useRef(null);
  const topTrackRef = useRef(null);
  const bottomTrackRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const mergedClients = mergeClientLogos(
    createFallbackClientLogos(),
    normalizeClientLogoItems(logos).map((logo) => ({
      ...logo,
      source: logo.source || "cloudinary",
    })),
  );

  // Keep the animated DOM bounded even if the CMS grows the client list.
  const displayClients = mergedClients.slice(0, 24);
  const row1 = displayClients.slice(0, Math.ceil(displayClients.length / 2));
  const row2 = displayClients.slice(Math.ceil(displayClients.length / 2));

  useEffect(() => {
    const section = marqueeRef.current;
    if (!section || isVisible) return;

    if (typeof IntersectionObserver === "undefined") {
      const fallbackTimer = window.setTimeout(() => setIsVisible(true), 0);
      return () => window.clearTimeout(fallbackTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return undefined;
    const topTrack = topTrackRef.current;
    const bottomTrack = bottomTrackRef.current;
    if (!topTrack || !bottomTrack) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const tracks = [
      { el: topTrack, direction: -1, baseSpeed: 0.24, x: 0, width: 1 },
      { el: bottomTrack, direction: 1, baseSpeed: 0.2, x: 0, width: 1 },
    ];

    let isMeasured = false;
    let lastY = window.scrollY;
    let boost = 0;

    const wrapX = (x, width) => {
      if (x <= -width) return x + width;
      if (x > 0) return x - width;
      return x;
    };

    const measure = () => {
      tracks.forEach((track, index) => {
        const nextWidth = track.el.scrollWidth / 2;
        track.width = nextWidth > 0 ? nextWidth : 1;

        if (!track.setX) {
          track.setX = gsap.quickSetter(track.el, "x", "px");
        }

        if (!isMeasured && index === 1) {
          track.x = -track.width * 0.5;
        }

        track.x = wrapX(track.x, track.width);
        track.setX(track.x);
      });

      isMeasured = true;
    };

    const tick = () => {
      const delta = gsap.ticker.deltaRatio(60);
      boost *= Math.pow(0.94, delta);
      const speedMul = 1 + boost;

      tracks.forEach((track) => {
        track.x += track.direction * track.baseSpeed * speedMul * delta;
        track.x = wrapX(track.x, track.width);
        track.setX(track.x);
      });
    };

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = Math.abs(currentY - lastY);
      lastY = currentY;
      boost = Math.min(2.6, boost + delta * 0.007);
    };

    measure();
    gsap.ticker.add(tick);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null;

    resizeObserver?.observe(topTrack);
    resizeObserver?.observe(bottomTrack);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      gsap.ticker.remove(tick);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isVisible]);

  const heading = (
    <div className={styles.clientsHeadingWrap}>
      <p className={styles.clientsKicker}>Selected brands</p>
      <h2 id="clients-heading" className={styles.clientsHeading}>
        Clients that trust us
      </h2>
    </div>
  );

  if (!isVisible) {
    return (
      <section
        ref={marqueeRef}
        className={`${styles.clientsMarquee} ${styles.clientsMarqueePlaceholder}`}
        aria-labelledby="clients-heading"
      >
        {heading}
      </section>
    );
  }

  return (
    <section
      ref={marqueeRef}
      className={styles.clientsMarquee}
      aria-labelledby="clients-heading"
    >
      {heading}
      <div className={styles.clientsMask} />

      <div className={`${styles.marqueeRow} ${styles.marqueeRowBottom}`}>
        <div
          ref={topTrackRef}
          className={`${styles.marqueeTrack} ${styles.marqueeTrackTop}`}
        >
          {row1.concat(row1).map((item, i) => (
            <div key={`r1-${i}`} className={styles.marqueeItem}>
              <Image
                src={optimizeImageUrl(item.url, 220)}
                alt="client logo"
                className={styles.clientLogo}
                width={160}
                height={80}
                style={{ objectFit: "contain", width: "auto", height: "auto" }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.marqueeRow}>
        <div
          ref={bottomTrackRef}
          className={`${styles.marqueeTrack} ${styles.marqueeTrackBottom}`}
        >
          {row2.concat(row2).map((item, i) => (
            <div key={`r2-${i}`} className={styles.marqueeItem}>
              <Image
                src={optimizeImageUrl(item.url, 220)}
                alt="client logo"
                className={styles.clientLogo}
                width={160}
                height={80}
                style={{ objectFit: "contain", width: "auto", height: "auto" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
