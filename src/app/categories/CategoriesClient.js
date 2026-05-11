"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import styles from "./categories.module.css";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_IMAGES = {
  Animation:
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
  CGI: "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?w=800&q=80",
  Design:
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80",
  "Motion Graphics":
    "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80",
  Photography:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
  Luxury:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  Characters:
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
  Typography:
    "https://images.unsplash.com/photo-1545987796-200677ee1011?w=800&q=80",
  AI: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80",
  "Set Design":
    "https://images.unsplash.com/photo-1509343256512-d77a5cb3791b?w=800&q=80",
  Beauty:
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
  "Archi & Design":
    "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80",
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";

export default function CategoriesClient({ categories, categoryImages = {} }) {
  const [active, setActive] = useState("All");
  const [hoveredCat, setHoveredCat] = useState(null);

  const catNames = ["All", ...Object.keys(categories)];

  const filteredCategories = useMemo(() => {
    if (active === "All") return categories;
    return Object.fromEntries(
      Object.entries(categories).filter(([k]) => k === active),
    );
  }, [active, categories]);

  return (
    <main className={styles.main}>
      {/* Hero */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Categories</h1>
        <p className={styles.heroTagline}>Explore our creative disciplines</p>
      </div>

      {/* Filter Pills */}
      <div className={styles.filterBar}>
        {catNames.map((name) => (
          <button
            key={name}
            className={`${styles.filterPill} ${active === name ? styles.filterPillActive : ""}`}
            onClick={() => setActive(name)}
            data-cursor="hover"
          >
            {name}
            {active === name && name !== "All" && (
              <span className={styles.filterPillCount}>{categories[name]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Category List */}
      <div className={styles.listContainer}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={styles.list}
          >
            {Object.entries(filteredCategories).map(([name, count]) => (
              <Link
                key={name}
                href={`/categories?filter=${encodeURIComponent(name)}`}
                className={styles.catItem}
                onMouseEnter={() => setHoveredCat(name)}
                onMouseLeave={() => setHoveredCat(null)}
                data-cursor="hover"
              >
                {/* Hover media reveal */}
                <motion.div
                  className={styles.catMedia}
                  initial={{ clipPath: "inset(0 0 100% round 10px)" }}
                  animate={
                    hoveredCat === name
                      ? { clipPath: "inset(0 0 0% round 10px)" }
                      : { clipPath: "inset(0 0 100% round 10px)" }
                  }
                  transition={{ duration: 0.7, ease: [0.165, 0.84, 0.44, 1] }}
                >
                  <img
                    src={
                      categoryImages[name] ||
                      CATEGORY_IMAGES[name] ||
                      FALLBACK_IMG
                    }
                    alt={name}
                    className={styles.catMediaImg}
                  />
                </motion.div>

                <div className={styles.catContent}>
                  <span className={styles.catName}>{name}</span>
                  <span className={styles.catCount}>
                    <span>{count}</span>
                  </span>
                </div>
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
