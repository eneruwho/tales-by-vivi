"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./projects.module.css";
import { optimizeImageUrl } from "../../lib/media";
import {
  getProjectArtistEntries,
  getProjectArtistLabel,
  getProjectArtistRoleSummary,
  getProjectArtistRoleEntries,
  getProjectArtistSlugs,
  getProjectRoleLabels,
} from "../../lib/projectArtists";

const PAGE_SIZE = 12;
const FACETS = ["category", "artist", "role"];

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function uniqueValues(values) {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const label = String(value || "").trim();
    if (!label) return;
    const key = normalizeText(label);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(label);
  });

  return result;
}

function parseFacetValues(searchParams, facet) {
  const values = [];

  searchParams.getAll(facet).forEach((entry) => {
    String(entry || "")
      .split(",")
      .forEach((value) => values.push(value));
  });

  // Backwards compatibility for old single-select URLs.
  const legacyFacet = searchParams.get("facet");
  const legacyValue = searchParams.get("value");
  if (legacyFacet === facet && legacyValue) {
    values.push(legacyValue);
  }

  return uniqueValues(values);
}

function buildProjectsHref(searchParams, nextState = {}) {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("facet");
  params.delete("value");

  FACETS.forEach((facet) => params.delete(facet));
  FACETS.forEach((facet) =>
    (nextState[facet] || []).forEach((value) => params.append(facet, value)),
  );

  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
}

function toggleFacetValueHref(searchParams, facet, value) {
  const current = {
    category: parseFacetValues(searchParams, "category"),
    artist: parseFacetValues(searchParams, "artist"),
    role: parseFacetValues(searchParams, "role"),
  };

  const normalizedTarget = normalizeText(value);
  const nextValues = current[facet].some(
    (item) => normalizeText(item) === normalizedTarget,
  )
    ? current[facet].filter((item) => normalizeText(item) !== normalizedTarget)
    : [...current[facet], value];

  return buildProjectsHref(searchParams, {
    ...current,
    [facet]: nextValues,
  });
}

function toSearchTokens(query) {
  return normalizeText(query).match(/[a-z0-9]+/g) || [];
}

// Everything needed to match a project is derived once, so toggling a filter
// is a cheap in-memory pass over the whole archive.
function buildProjectIndex(project) {
  const artistEntries = getProjectArtistEntries(project);
  const categories = (Array.isArray(project.categories) ? project.categories : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const roles = getProjectRoleLabels(project);
  const artistTokens = new Set(
    [
      ...artistEntries.flatMap((artist) => [artist.slug, artist.name]),
      ...getProjectArtistSlugs(project),
    ]
      .filter(Boolean)
      .map(normalizeText),
  );

  return {
    project,
    artistLabels: artistEntries
      .map((artist) => artist.name || artist.slug)
      .filter(Boolean),
    categoryLabels: categories,
    roleLabels: roles,
    categories: new Set(categories.map(normalizeText)),
    artistTokens,
    roles: new Set(roles.map(normalizeText)),
    roleEntries: getProjectArtistRoleEntries(project).map((entry) => ({
      tokens: new Set([entry.slug, entry.name].filter(Boolean).map(normalizeText)),
      roles: new Set((entry.roles || []).map(normalizeText)),
    })),
    haystack: [
      project.title,
      ...categories,
      ...artistEntries.flatMap((artist) => [artist.name, artist.slug]),
      ...roles,
    ]
      .join(" ")
      .toLowerCase(),
  };
}

function normalizeSelection(selected) {
  return {
    category: selected.category.map(normalizeText),
    artist: selected.artist.map(normalizeText),
    role: selected.role.map(normalizeText),
    search: selected.search,
  };
}

function matchesIndexedProject(entry, selection) {
  if (selection.search.some((token) => !entry.haystack.includes(token))) {
    return false;
  }
  if (
    selection.category.length &&
    !selection.category.some((value) => entry.categories.has(value))
  ) {
    return false;
  }

  const hasArtist = selection.artist.length > 0;
  const hasRole = selection.role.length > 0;

  // Artist + role together must be a pairing: the artist holds that role.
  if (hasArtist && hasRole) {
    return selection.artist.some((artist) =>
      entry.roleEntries.some((roleEntry) => {
        // Legacy role lists have no artist attached; they apply to the project.
        const belongs = roleEntry.tokens.size
          ? roleEntry.tokens.has(artist)
          : entry.artistTokens.has(artist);
        return (
          belongs && selection.role.some((role) => roleEntry.roles.has(role))
        );
      }),
    );
  }

  if (hasArtist && !selection.artist.some((value) => entry.artistTokens.has(value))) {
    return false;
  }
  if (hasRole && !selection.role.some((value) => entry.roles.has(value))) {
    return false;
  }
  return true;
}

function collectOptions(index) {
  const maps = { category: new Map(), artist: new Map(), role: new Map() };
  const add = (map, label) => {
    const key = normalizeText(label);
    if (key && !map.has(key)) map.set(key, String(label).trim());
  };

  index.forEach((entry) => {
    entry.categoryLabels.forEach((label) => add(maps.category, label));
    entry.artistLabels.forEach((label) => add(maps.artist, label));
    entry.roleLabels.forEach((label) => add(maps.role, label));
  });

  const sorted = (map) =>
    Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  return {
    category: sorted(maps.category),
    artist: sorted(maps.artist),
    role: sorted(maps.role),
  };
}

function FilterChip({
  href,
  onNavigate,
  children,
  active = false,
  count,
  disabled = false,
}) {
  function handleClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    if (!disabled) onNavigate(href);
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`${styles.filterChip} ${active ? styles.filterChipActive : ""} ${
        disabled ? styles.filterChipDim : ""
      }`}
      data-cursor="hover"
      aria-current={active ? "true" : undefined}
      aria-disabled={disabled ? "true" : undefined}
    >
      {children}
      {typeof count === "number" && (
        <span className={styles.filterCount}>{count}</span>
      )}
    </a>
  );
}

export default function ProjectsClient({
  projects = [],
  degraded = false,
  artists = [],
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [searchDraft, setSearchDraft] = useState(null);
  const searchInput = searchDraft ?? urlQuery;

  const selectedFilters = useMemo(
    () => ({
      category: parseFacetValues(searchParams, "category"),
      artist: parseFacetValues(searchParams, "artist"),
      role: parseFacetValues(searchParams, "role"),
    }),
    [searchParams],
  );

  const hasActiveFilters =
    FACETS.some((facet) => selectedFilters[facet].length > 0) ||
    Boolean(urlQuery);

  // Filter state lives in the URL, but changing it is a client-only history
  // update: no server render, no Worker request, no database read.
  const navigate = useCallback((href) => {
    setSearchDraft(null);
    window.history.pushState(null, "", href);
  }, []);

  const index = useMemo(() => projects.map(buildProjectIndex), [projects]);
  const allOptions = useMemo(() => collectOptions(index), [index]);

  const searchTokens = useMemo(() => toSearchTokens(urlQuery), [urlQuery]);

  const filteredProjects = useMemo(() => {
    const selection = normalizeSelection({
      ...selectedFilters,
      search: searchTokens,
    });
    return index
      .filter((entry) => matchesIndexedProject(entry, selection))
      .map((entry) => entry.project);
  }, [index, selectedFilters, searchTokens]);

  // How many projects each chip would show given the other active filters, so
  // dead-end combinations are visible before you click them.
  const facetCounts = useMemo(() => {
    const counts = { category: {}, artist: {}, role: {} };
    FACETS.forEach((facet) => {
      allOptions[facet].forEach((value) => {
        const selection = normalizeSelection({
          ...selectedFilters,
          [facet]: [value],
          search: searchTokens,
        });
        counts[facet][normalizeText(value)] = index.reduce(
          (total, entry) => total + (matchesIndexedProject(entry, selection) ? 1 : 0),
          0,
        );
      });
    });
    return counts;
  }, [index, allOptions, selectedFilters, searchTokens]);

  // Paging resets whenever the filters change.
  const filterKey = searchParams.toString();
  const [paging, setPaging] = useState({ key: filterKey, count: PAGE_SIZE });
  const visibleCount = paging.key === filterKey ? paging.count : PAGE_SIZE;
  const visibleProjects = filteredProjects.slice(0, visibleCount);
  const hasMore = filteredProjects.length > visibleCount;

  const showMore = useCallback(() => {
    setPaging((current) => ({
      key: filterKey,
      count: (current.key === filterKey ? current.count : PAGE_SIZE) + PAGE_SIZE,
    }));
  }, [filterKey]);

  const sentinelRef = useRef(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) showMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, showMore, visibleCount]);

  function submitSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) params.set("q", searchInput.trim());
    else params.delete("q");
    navigate(`/projects${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const clearAllHref = "/projects";

  const facetGroups = [
    { key: "category", title: "Categories" },
    { key: "artist", title: "Artists" },
    { key: "role", title: "Roles" },
  ].map((group) => ({ ...group, values: allOptions[group.key] }));

  const activeFilterChips = [
    ...selectedFilters.category.map((value) => ({
      key: `category:${value}`,
      facet: "category",
      label: `Category: ${value}`,
      value,
    })),
    ...selectedFilters.artist.map((value) => ({
      key: `artist:${value}`,
      facet: "artist",
      label: `Artist: ${value}`,
      value,
    })),
    ...selectedFilters.role.map((value) => ({
      key: `role:${value}`,
      facet: "role",
      label: `Role: ${value}`,
      value,
    })),
  ];

  const statusMessage = degraded
    ? "The project archive is temporarily unavailable. You can still browse artist profiles below."
    : null;

  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Archive</p>
            <h1 className={styles.title}>Projects</h1>
            <p className={styles.subtitle}>
              Stack categories, artists, and roles any way you want. The filters
              combine together, so you can narrow the archive exactly the way
              you need.
            </p>
          </div>
          <Link href="/" className={styles.backLink}>
            Back to home
          </Link>
        </header>

        {statusMessage && (
          <section className={styles.statusPanel} role="status" aria-live="polite">
            <div>
              <p className={styles.statusKicker}>Archive status</p>
              <p className={styles.statusText}>{statusMessage}</p>
            </div>
            {filteredProjects.length === 0 && (
              <div className={styles.statusLinks}>
                <button
                  type="button"
                  className={styles.statusLink}
                  onClick={() => router.refresh()}
                >
                  Try again
                </button>
                <Link href="/artists" className={styles.statusLink}>
                  Browse artists
                </Link>
                <a
                  href="https://www.instagram.com/talesby.vivi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.statusLink}
                >
                  Tales by VIVI on Instagram
                </a>
              </div>
            )}
          </section>
        )}

        <section className={styles.filtersPanel} aria-label="Project filters">
          <form className={styles.searchForm} onSubmit={submitSearch}>
            <label htmlFor="project-search" className={styles.filterGroupTitle}>
              Search projects
            </label>
            <div className={styles.searchRow}>
              <input
                id="project-search"
                value={searchInput}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Title, category, artist..."
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                Search
              </button>
            </div>
          </form>
          <div className={styles.filterPills}>
            <FilterChip
              href="/projects"
              onNavigate={navigate}
              active={!hasActiveFilters}
            >
              All Projects
            </FilterChip>
            <span className={styles.filterHint}>
              Select multiple chips to stack filters. Numbers show matching projects.
            </span>
          </div>

          {hasActiveFilters && (
            <div className={styles.activeFilterRow}>
              <span className={styles.activeFilterLabel}>Active filters</span>
              <div className={styles.activeFilterChips}>
                {activeFilterChips.map((chip) => (
                  <FilterChip
                    key={chip.key}
                    onNavigate={navigate}
                    href={toggleFacetValueHref(
                      searchParams,
                      chip.facet,
                      chip.value,
                    )}
                    active
                  >
                    {chip.label}
                  </FilterChip>
                ))}
              </div>
              <a
                href={clearAllHref}
                className={styles.clearFilterLink}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(clearAllHref);
                }}
              >
                Clear all
              </a>
            </div>
          )}

          <div className={styles.filterGroups}>
            {facetGroups.map((group) => (
              <div key={group.key} className={styles.filterGroup}>
                <p className={styles.filterGroupTitle}>{group.title}</p>
                <div className={styles.filterChipRow}>
                  {group.values.map((value) => {
                    const active = selectedFilters[group.key].some(
                      (item) => normalizeText(item) === normalizeText(value),
                    );

                    return (
                      <FilterChip
                        key={value}
                        onNavigate={navigate}
                        count={facetCounts[group.key][normalizeText(value)]}
                        disabled={
                          !active && facetCounts[group.key][normalizeText(value)] === 0
                        }
                        href={toggleFacetValueHref(
                          searchParams,
                          group.key,
                          value,
                        )}
                        active={active}
                      >
                        {value}
                      </FilterChip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {filteredProjects.length > 0 ? (
          <section className={styles.grid}>
            {visibleProjects.map((project) => {
              const imageSrc = project.previewImageUrl || project.imageUrl;
              const artistEntries = getProjectArtistEntries(project);
              const artistLabel = getProjectArtistLabel(project);
              const roleSummary = getProjectArtistRoleSummary(project);

              return (
                <article
                  key={project.id}
                  className={styles.card}
                  onClick={() => router.push(`/projects/${project.slug}`)}
                  style={{ cursor: "pointer" }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    router.push(`/projects/${project.slug}`)
                  }
                  aria-label={`Open ${project.title}`}
                >
                  <div className={styles.mediaWrap}>
                    {imageSrc ? (
                      <Image
                        src={optimizeImageUrl(imageSrc, 900)}
                        alt={project.title}
                        className={styles.media}
                        width={1600}
                        height={900}
                        sizes="(max-width: 768px) 92vw, 45vw"
                        unoptimized
                      />
                    ) : (
                      <div className={styles.placeholder}>
                        <span>No preview image</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.info}>
                    <div className={styles.metaLine}>
                      <span className={styles.index}>
                        {String(project.id).padStart(2, "0")}
                      </span>
                      {Array.isArray(project.categories) &&
                        project.categories.length > 0 && (
                          <span className={styles.categories}>
                            {project.categories.join(", ")}
                          </span>
                        )}
                    </div>

                    <h2 className={styles.cardTitle}>{project.title}</h2>

                    <div className={styles.artistRow}>
                      {artistEntries.length > 0 ? (
                        artistEntries.map((artist) => (
                          <Link
                            key={artist.slug}
                            href={`/artists/${artist.slug}`}
                            className={styles.artistLink}
                            data-cursor="hover"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {artist.name}
                          </Link>
                        ))
                      ) : (
                        <span className={styles.artistFallback}>
                          {artistLabel || "Unknown artists"}
                        </span>
                      )}
                    </div>

                    {roleSummary.length > 0 && (
                      <div className={styles.roleRow}>
                        {roleSummary.map((role) => (
                          <span key={role} className={styles.rolePill}>
                            {role}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className={styles.emptyState}>
            <p>No projects match these filters yet.</p>
            <Link href="/projects" className={styles.adminLink}>
              Clear filters
            </Link>
          </div>
        )}

        {hasMore && (
          <div className={styles.loadMoreWrap} ref={sentinelRef}>
            <button
              type="button"
              className={styles.loadMoreButton}
              onClick={showMore}
            >
              Load more projects
            </button>
          </div>
        )}

        {filteredProjects.length === 0 && degraded && artists.length > 0 && (
          <section className={styles.artistFallback} aria-label="Artist profiles">
            <p className={styles.statusKicker}>Artist profiles remain available</p>
            <div className={styles.statusLinks}>
              {artists.filter((artist) => artist.instagramUrl).map((artist) => (
                <a
                  key={artist.id}
                  href={artist.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.statusLink}
                >
                  {artist.name} on Instagram
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
