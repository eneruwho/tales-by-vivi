'use client'

import styles from './about.module.css'
import SplitTextReveal from '../../components/SplitTextReveal'

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <div className={styles.heroContainer}>
        <SplitTextReveal
          elementType="h1"
          className={styles.heroText}
          text="WORLD-CLASS IMAGERY.<br/>NO COMPROMISES.
"
          delay={0.3}
          stagger={0.1}
        />

        <div className={styles.copyBlock}>
          <SplitTextReveal
            elementType="p"
            className={styles.paragraph}
            text="Tales by vivi is a creative production house built on serious craft. We don't just assemble footage. We build the grade, shape the narrative, and push the boundaries of digital artistry to deliver premium, undeniable visuals."
            delay={0.6}
            stagger={0.02}
          />
        </div>

        <div className={styles.founderSection}>
          <SplitTextReveal
            elementType="h2"
            className={styles.h2}
            text="Founded by Vivi — We are the partners who"
            delay={0.1}
            stagger={0.02}
          />
          <ul className={styles.list}>
            <li>obsess over the smallest pixel so you don&apos;t have to.</li>
            <li>integrate the latest AI capabilities without ever losing the human touch.</li>
            <li>deliver faster than your deadlines demand.</li>
            <li>would honestly choose a flawless final export over almost anything (except maybe a great slice of pizza).</li>
          </ul>
        </div>

        <div className={styles.socialRow}>
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
              <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </div>
    </main>
  )
}
