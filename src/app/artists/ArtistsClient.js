'use client'
import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import styles from './artists.module.css'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function ArtistsClient({ artists, projects }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeProjectIdx, setActiveProjectIdx] = useState(0)
  const containerRef = useRef(null)
  const slideshowIntervalRef = useRef(null)

  // Aggregate data so we know the artist and all their projects
  const displayArtists = artists.map(artist => {
    const artistProjects = projects.filter(p => p.artistSlug === artist.slug || p.artist === artist.name)
    return {
      ...artist,
      projects: artistProjects,
      cover: artistProjects.length > 0 ? artistProjects[0] : null
    }
  })

  useEffect(() => {
    // Initial reveal
    gsap.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.5, ease: 'power3.out' }
    )
  }, [])

  // Auto-slideshow for projects
  useEffect(() => {
    const activeArtist = displayArtists[activeIndex]
    if (!activeArtist || activeArtist.projects.length <= 1) {
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current)
      }
      return
    }

    // Clear existing interval
    if (slideshowIntervalRef.current) {
      clearInterval(slideshowIntervalRef.current)
    }

    // Set new interval
    slideshowIntervalRef.current = setInterval(() => {
      setActiveProjectIdx(prev => (prev + 1) % activeArtist.projects.length)
    }, 3500) // Change every 3.5 seconds

    return () => {
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current)
      }
    }
  }, [activeIndex, displayArtists])

  // Reset project index when artist changes
  useEffect(() => {
    setActiveProjectIdx(0)
  }, [activeIndex])

  const activeArtist = displayArtists[activeIndex] || displayArtists[0]
  const activeProject = activeArtist?.projects[activeProjectIdx] || activeArtist?.cover || null

  if (!displayArtists || displayArtists.length === 0) {
    return (
      <main className={styles.main}>
        <div style={{height: '100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <p>No artists found.</p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main} ref={containerRef}>
      {/* Background Layer: Massive Text & Image Blur */}
      <AnimatePresence>
        <motion.div 
          key={activeArtist.id}
          className={styles.bgLayer}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {activeArtist.cover && (
            <img 
              src={activeArtist.cover.imageUrl} 
              alt=""
              className={styles.bgImage}
            />
          )}
          <h1 className={styles.massiveBgText}>{activeArtist.name}</h1>
        </motion.div>
      </AnimatePresence>

      <div className={styles.foreground}>
        {/* Left List */}
        <div className={styles.listCol}>
          <ul className={styles.ul}>
            {displayArtists.map((artist, i) => (
              <li key={artist.id} className={styles.li}>
                {activeIndex === i && <span className={styles.activeSquare} />}
                <Link 
                  href={`/artists/${artist.slug}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`${styles.link} ${activeIndex === i ? styles.activeLink : ''}`}
                  data-cursor="hover"
                >
                  {artist.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Center Media */}
        <div className={styles.mediaCol}>
          <AnimatePresence mode="wait">
            {activeProject ? (
              <motion.div
                key={`${activeArtist.id}-${activeProjectIdx}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={styles.mediaWrapper}
              >
                <Link href={`/projects/${activeProject.slug}`} data-cursor="hover" style={{display:'block', height:'100%', width:'100%', position:'relative'}}>
                  {activeProject.videoUrl ? (
                    <video
                      src={activeProject.videoUrl}
                      autoPlay loop muted playsInline
                      className={styles.media}
                    />
                  ) : (
                    <img src={activeProject.imageUrl} alt={activeProject.title} className={styles.media} />
                  )}
                  {/* Project name overlay */}
                  <div className={styles.projectNameOverlay}>
                    <span className={styles.projectName}>{activeProject.title}</span>
                  </div>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className={styles.placeholderMedia}
              >
                Coming Soon
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Pagination */}
        <div className={styles.paginationCol}>
          {displayArtists.map((_, i) => (
            <div 
              key={i} 
              className={`${styles.pageDot} ${i === activeIndex ? styles.activeDot : ''}`}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
