"use client";
import Link from "next/link";
import styles from "./Footer.module.css";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const navLinks = [
  { name: "Artists", path: "/artists" },
  { name: "Categories", path: "/projects" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

const socials = [
  { name: "Instagram", url: "https://www.instagram.com/talesby.vivi/" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentYear] = useState(() => new Date().getFullYear());

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.165, 0.84, 0.44, 1] },
    },
  };

  const logoLines = ["TALES", "BY VIVI"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <footer className={styles.footer}>
      <motion.div
        className={styles.wrapper}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        {/* Top row */}
        <div className={styles.topRow}>
          <div className={styles.leftCol}>
            <motion.p className={styles.tagline} variants={itemVariants}>
              Films, Motion & Visual Craft.
            </motion.p>
            {/* Newsletter */}
            <motion.div className={styles.newsletter} variants={itemVariants}>
              <form onSubmit={handleSubmit} className={styles.newsletterForm}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.newsletterInput}
                  aria-label="Email for newsletter"
                />
                <button
                  type="submit"
                  className={`${styles.newsletterBtn} ${email ? styles.newsletterBtnVisible : ""}`}
                  aria-label="Subscribe"
                >
                  →
                </button>
              </form>
              {submitted && (
                <p
                  className={styles.successMsg}
                >{`Thanks! We'll be in touch.`}</p>
              )}
            </motion.div>
            {/* Socials */}
            <motion.div className={styles.socials} variants={itemVariants}>
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  data-title={s.name}
                  data-cursor="hover"
                >
                  <span>{s.name}</span>
                </a>
              ))}
            </motion.div>
          </div>

          <div className={styles.rightCol}>
            <motion.nav className={styles.nav} variants={itemVariants}>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={styles.navItem}
                  data-cursor="hover"
                >
                  <span className={styles.navSquare} />
                  <span>{link.name}</span>
                </Link>
              ))}
            </motion.nav>
            <motion.div className={styles.credits} variants={itemVariants}>
              <span className={styles.creditsTitle}>Crafted by</span>
              <div className={styles.creditsItems}>
                <span className={styles.creditsItem}>Vryks Media</span>
                <span className={styles.creditsSep} />
                <span className={styles.creditsItem}>
                  © {currentYear ?? ""}
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Giant logo bottom */}
        <motion.div className={styles.bigLogo} variants={itemVariants}>
          {logoLines.map((line, lineIndex) => (
            <div key={line} className={styles.bigLogoLine}>
              {line.split("").map((char, charIndex) => (
                <motion.span
                  key={`${line}-${charIndex}`}
                  className={styles.bigLogoChar}
                  initial={{ y: 70, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.8 }}
                  transition={{
                    duration: 0.7,
                    delay: lineIndex * 0.14 + charIndex * 0.02,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </footer>
  );
}
