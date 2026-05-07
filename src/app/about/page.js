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
        
        <div style={{marginTop: '4rem'}}>
          <SplitTextReveal 
            elementType="p" 
            className={styles.paragraph}
            text="Since 2022, Tales by VIVI is a creative production house. We create premium digital imagery and animation alongside world-class artists for ambitious brands!"
            delay={0.6}
            stagger={0.02}
          />
        </div>

        <div className={styles.founderSection}>
          <SplitTextReveal 
            elementType="h2" 
            className={styles.h2}
            text="Founded by Vivi — Your trusted partner who"
            delay={0.1}
            stagger={0.02}
          />
          <ul className={styles.list}>
            <li>will never cancel a business lunch!</li>
            <li>replies faster than your group chat.</li>
            <li>takes the work seriously, not herself.</li>
            <li>can stay longer on calls than your grandma.</li>
            <li>would choose a Pizza for her last meal.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
