"use client";
import styles from "./contact.module.css";
import SplitTextReveal from "../../components/SplitTextReveal";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

export default function ContactPage() {
  const [spin, setSpin] = useState(0);
  const cities = useMemo(
    () => [
      { name: "Paris", line1: "14, rue Yvonne le Tac", line2: "75018 - Paris" },
      { name: "London", line1: "50 Tavistock Road", line2: "W11 1AW - London" },
      {
        name: "Austin",
        line1: "208 Barton Springs Rd",
        line2: "TX 78704 - Austin",
      },
      { name: "Kolkata", line1: "Park Street", line2: "West Bengal - Kolkata" },
    ],
    [],
  );

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <SplitTextReveal
          elementType="h1"
          className={styles.h1}
          text="We’re friendly.<br/>We’re talented.<br/>We answer fast.<br/>Call us!"
          delay={0.1}
          stagger={0.05}
        />

        <div>
          <SplitTextReveal
            elementType="h2"
            className={styles.h2}
            text="Always open to bold ideas and serious craft."
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
            <a href="mailto:hello@talesbyvivi.fr" data-cursor="hover">
              hello@talesbyvivi.fr
            </a>
          </motion.h2>
        </div>

        <motion.div
          className={styles.grid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          <div>
            <h3>Paris</h3>
            <p>
              14, rue Yvonne le Tac
              <br />
              75018 - Paris
            </p>
          </div>
          <div>
            <h3>London</h3>
            <p>
              50 Tavistock Road
              <br />
              W11 1AW - London
            </p>
          </div>
          <div>
            <h3>Social</h3>
            <p>
              <a
                href="https://www.instagram.com/talesby.vivi/"
                target="_blank"
                rel="noreferrer"
                data-cursor="hover"
              >
                Instagram
              </a>
              <br />
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                data-cursor="hover"
              >
                LinkedIn
              </a>
            </p>
          </div>
        </motion.div>

        <motion.section
          className={styles.spinSection}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8 }}
        >
          <div className={styles.spinHead}>
            <h3>Spin &amp; See</h3>
            <button
              type="button"
              className={styles.spinBtn}
              onClick={() => setSpin((s) => s + 90)}
            >
              Rotate
            </button>
          </div>
          <div className={styles.wheelWrap}>
            <motion.div
              className={styles.wheel}
              animate={{ rotate: spin }}
              transition={{ type: "spring", stiffness: 80, damping: 18 }}
            >
              {cities.map((city, i) => {
                const angle = i * (360 / cities.length);
                return (
                  <div
                    key={city.name}
                    className={styles.wheelCard}
                    style={{
                      transform: `rotate(${angle}deg) translateY(-10.8rem) rotate(${-angle}deg)`,
                    }}
                  >
                    <strong>{city.name}</strong>
                    <span>{city.line1}</span>
                    <span>{city.line2}</span>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
