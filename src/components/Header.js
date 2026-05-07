"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";

export default function Header() {
  const pathname = usePathname();
  const [times, setTimes] = useState({
    paris: "00:00",
    kolkata: "00:00",
    texas: "00:00",
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);
  const [currentTzIndex, setCurrentTzIndex] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const menuCloseTimeoutRef = useRef(null);

  useEffect(() => {
    const updateClock = () => {
      const date = new Date();
      const parisFormatter = new Intl.DateTimeFormat("fr-FR", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        minute: "2-digit",
      });
      const kolkataFormatter = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
      });
      const texasFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        hour: "2-digit",
        minute: "2-digit",
      });
      setTimes({
        paris: parisFormatter.format(date),
        kolkata: kolkataFormatter.format(date),
        texas: texasFormatter.format(date),
      });
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (menuCloseTimeoutRef.current)
        clearTimeout(menuCloseTimeoutRef.current);
    };
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  const handleMenuClose = () => {
    if (menuCloseTimeoutRef.current) clearTimeout(menuCloseTimeoutRef.current);
    menuCloseTimeoutRef.current = setTimeout(() => {
      setMenuOpen(false);
      setMenuHovered(false);
    }, 300);
  };

  const handleMenuMouseEnter = () => {
    if (menuCloseTimeoutRef.current) clearTimeout(menuCloseTimeoutRef.current);
    setMenuHovered(true);
    setMenuOpen(true);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Artists", path: "/artists" },
    { name: "Categories", path: "/categories" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const pillVariants = {
    closed: { width: 100, borderRadius: 40 },
    open: { width: "auto", borderRadius: 8 },
  };

  const navItemVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: 0.08 * i + 0.15,
        duration: 0.6,
        ease: [0.165, 0.84, 0.44, 1],
      },
    }),
    exit: (i) => ({
      y: "-100%",
      opacity: 0,
      transition: {
        delay: 0.04 * i,
        duration: 0.4,
        ease: [0.65, 0, 0.35, 1],
      },
    }),
  };

  return (
    <>
      {/* Top bar */}
      <header className={styles.header}>
        <Link
          href="/"
          className={styles.logo}
          data-cursor="hover"
          aria-label="Go to homepage"
        >
          <Image
            src="/logo.png"
            alt="Tales by VIVI"
            className={styles.logoImg}
            width={120}
            height={60}
          />
        </Link>
        <div className={styles.headerRight}>
          <div
            className={styles.clock}
            onClick={() => setCurrentTzIndex((prev) => (prev + 1) % 3)}
            data-cursor="pointer"
            style={{ cursor: "pointer" }}
          >
            <span className={styles.clockCity}>
              {currentTzIndex === 0
                ? "PARIS"
                : currentTzIndex === 1
                  ? "KOLKATA"
                  : "TEXAS"}
            </span>
            <span className={styles.clockTime}>
              {currentTzIndex === 0
                ? times.paris
                : currentTzIndex === 1
                  ? times.kolkata
                  : times.texas}
            </span>
          </div>
        </div>
      </header>

      {/* Floating Bottom Pill */}
      <div className={styles.pillContainer}>
        <motion.div
          className={styles.menuPill}
          variants={pillVariants}
          animate={menuOpen ? "open" : "closed"}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuClose}
        >
          <AnimatePresence mode="wait">
            {!menuOpen ? (
              <motion.button
                key="menu-btn"
                className={styles.menuBtn}
                onClick={() => setMenuOpen(!menuOpen)}
                data-cursor="hover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                <span>Menu</span>
              </motion.button>
            ) : (
              <motion.div
                key="nav-open"
                className={styles.navLinks}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                {navLinks.map((link, i) => (
                  <div key={link.path} className={styles.navItemWrap}>
                    <motion.div
                      custom={i}
                      variants={navItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <Link
                        href={link.path}
                        onClick={() => setMenuOpen(false)}
                        className={`${styles.navItem} ${pathname === link.path ? styles.active : ""}`}
                        data-cursor="hover"
                      >
                        {pathname === link.path && (
                          <span className={styles.activeSquare} />
                        )}
                        {link.name}
                      </Link>
                    </motion.div>
                  </div>
                ))}
                <motion.button
                  key="close-btn"
                  className={styles.closeBtn}
                  onClick={() => setMenuOpen(false)}
                  data-cursor="hover"
                  custom={navLinks.length}
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  Close
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Dark/Light Toggle — Two pill circles */}
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          data-cursor="hover"
          aria-label="Toggle dark/light mode"
          title={
            theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
          }
        >
          <span
            className={styles.themeCircle}
            data-active={theme === "light" ? "true" : "false"}
          />
          <span
            className={styles.themeCircle}
            data-active={theme === "dark" ? "true" : "false"}
          />
        </button>
      </div>
    </>
  );
}
