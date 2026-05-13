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
          text="Digital Artists.<br/>World-class.<br/>Nothing less."
          delay={0.3}
          stagger={0.1}
        />

        <div className={styles.copyBlock}>
          <SplitTextReveal
            elementType="p"
            className={styles.paragraph}
            text="Since 2022, Tales by VIVI has been a creative production house. We create premium digital imagery and animation alongside world-class artists for ambitious brands."
            delay={0.6}
            stagger={0.02}
          />
        </div>

        <div className={styles.founderSection}>
          <SplitTextReveal
            elementType="h2"
            className={styles.h2}
            text="Founded by Vivi — your trusted partner who"
            delay={0.1}
            stagger={0.02}
          />
          <ul className={styles.list}>
            <li>will never cancel a business lunch.</li>
            <li>replies faster than your group chat.</li>
            <li>takes the work seriously, not herself.</li>
            <li>can stay longer on calls than your grandma.</li>
            <li>would choose pizza for her last meal.</li>
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
