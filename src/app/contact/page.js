"use client";
import styles from "./contact.module.css";
import SplitTextReveal from "../../components/SplitTextReveal";
import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <SplitTextReveal
          elementType="h1"
          className={styles.h1}
          text="Pixel Perfect.<br/>FRAME ACCURATE.<br/>STORY DRIVEN.<br/>REACH OUT."
          delay={0.1}
          stagger={0.05}
        />

        <div>
          <SplitTextReveal
            elementType="h2"
            className={styles.h2}
            text="Elevating narratives through meticulous editing, color, and cinematic design."
            delay={0.6}
            stagger={0.02}
          />
          <motion.h2
            className={styles.h2}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            style={{ marginTop: "0.5rem" }}
          >
            <a href="mailto:talesbyvivi@gmail.com" data-cursor="hover">
              talesbyvivi@gmail.com
            </a>
          </motion.h2>
        </div>

        <motion.div
          className={styles.socialRow}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <a
            href="https://www.instagram.com/talesby.vivi/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialIconLink}
            aria-label="Instagram"
            data-cursor="hover"
          >
            <svg
              className={styles.socialIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
              <circle cx="12" cy="12" r="3.5" />
              <circle
                cx="17.2"
                cy="6.8"
                r="0.9"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </main>
  );
}
