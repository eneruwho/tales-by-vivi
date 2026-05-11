"use client";
import { useState, useEffect, useRef } from "react";
import styles from "../app/admin/admin.module.css";

export default function ArtistSelect({
  artists: initialArtists = [],
  defaultArtist = "",
  defaultSlug = "",
  onSelect = null,
}) {
  const [options, setOptions] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(defaultArtist || "");
  const [selectedSlug, setSelectedSlug] = useState(defaultSlug || "");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Use initialArtists directly if provided
    if (Array.isArray(initialArtists) && initialArtists.length > 0) {
      setOptions(initialArtists);
      return;
    }
    // Only fetch if no initial artists provided
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/get-artists");
        const json = await res.json();
        if (!mounted) return;
        setOptions(Array.isArray(json.artists) ? json.artists : initialArtists);
      } catch (err) {
        setOptions(initialArtists);
      }
    }
    load();

    const onArtistsChanged = () => load();
    window.addEventListener("artists:changed", onArtistsChanged);
    return () => {
      mounted = false;
      window.removeEventListener("artists:changed", onArtistsChanged);
    };
  }, [initialArtists]);

  useEffect(() => {
    function handleClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const filtered = options.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase()),
  );

  async function addArtist(name) {
    setLoading(true);
    try {
      const slug = name
        .toString()
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      const res = await fetch("/api/add-artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const json = await res.json();
      if (json?.artist) {
        setOptions((prev) => [...prev, json.artist]);
        setSelected(json.artist.name);
        setSelectedSlug(json.artist.slug);
        setQuery("");
        window.dispatchEvent(new Event("artists:changed"));
      } else {
        alert("Could not add artist: " + (json?.error || "unknown"));
      }
    } catch (err) {
      alert("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleChoose = (a) => {
    setSelected(a.name);
    setSelectedSlug(a.slug);
    setOpen(false);
    setQuery("");
    // Call onSelect callback if provided
    if (typeof onSelect === "function") {
      onSelect({ name: a.name, slug: a.slug });
    }
  };

  return (
    <div ref={containerRef} className={styles.artistPicker}>
      <input
        name="artistInput"
        placeholder="Search or add artist..."
        value={query || selected}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected("");
          setSelectedSlug("");
        }}
        onFocus={() => setOpen(true)}
        className={styles.artistPickerInput}
        autoComplete="off"
      />

      {open && (
        <div className={styles.artistPickerDropdown}>
          {filtered.length === 0 && (
            <div className={styles.artistPickerEmpty}>
              <div>No results</div>
              <button
                type="button"
                onClick={() => {
                  const name = query || window.prompt("Artist name");
                  if (name) addArtist(name);
                }}
                disabled={loading}
                className={styles.artistPickerAddBtn}
              >
                {loading ? "Adding…" : "Add"}
              </button>
            </div>
          )}
          {filtered.map((a) => (
            <div
              key={a.id || a.slug}
              onClick={() => handleChoose(a)}
              className={styles.artistPickerItem}
            >
              {a.name}
            </div>
          ))}
        </div>
      )}

      <input type="hidden" name="artist" value={selected} />
      <input type="hidden" name="artistSlug" value={selectedSlug} />
    </div>
  );
}
