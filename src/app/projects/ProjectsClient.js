"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./projects.module.css";
import {
  getProjectArtistEntries,
  getProjectArtistLabel,
  getProjectArtistRoleSummary,
  getProjectArtistRoleEntries,
  getProjectArtistSlugs,
  getProjectRoleLabels,
} from "../../lib/projectArtists";

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

  ["category", "artist", "role"].forEach((facet) => params.delete(facet));

  const categories = nextState.category || [];
  const artists = nextState.artist || [];
  const roles = nextState.role || [];

  categories.forEach((value) => params.append("category", value));
  artists.forEach((value) => params.append("artist", value));
  roles.forEach((value) => params.append("role", value));

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

function matchesSelectedValues(values, selectedValues) {
  if (!selectedValues.length) return true;
  const normalizedValues = values.map((value) => normalizeText(value));
  return selectedValues.some((selected) =>
    normalizedValues.includes(normalizeText(selected)),
  );
}

function matchesProjectFilters(project, selectedFilters) {
  const projectCategories = Array.isArray(project.categories)
    ? project.categories
    : [];
  const projectArtists = getProjectArtistEntries(project);
  const projectArtistTokens = [
    ...projectArtists.map((artist) => artist.slug),
    ...projectArtists.map((artist) => artist.name),
    ...getProjectArtistSlugs(project),
  ].filter(Boolean);
  const projectRoles = getProjectRoleLabels(project);

  // Category must match (if selected)
  if (!matchesSelectedValues(projectCategories, selectedFilters.category))
    return false;

  const hasArtistSel = selectedFilters.artist.length > 0;
  const hasRoleSel = selectedFilters.role.length > 0;

  // If both artist and role are selected, require an artist-role pairing
  if (hasArtistSel && hasRoleSel) {
    const roleEntries = getProjectArtistRoleEntries(project);

    // Check that at least one selected artist has at least one of the selected roles
    const artistRoleMatch = selectedFilters.artist.some((selArtist) => {
      const normArtist = normalizeText(selArtist);

      return roleEntries.some((entry) => {
        const entrySlug = normalizeText(entry.slug || "");
        const entryName = normalizeText(entry.name || "");

        const artistMatchesEntry =
          (entrySlug && entrySlug === normArtist) ||
          (entryName && entryName === normArtist) ||
          projectArtistTokens.map(normalizeText).includes(normArtist);

        if (!artistMatchesEntry) return false;

        const entryRoles = (Array.isArray(entry.roles) ? entry.roles : []).map(
          normalizeText,
        );
        return selectedFilters.role.some((selRole) =>
          entryRoles.includes(normalizeText(selRole)),
        );
      });
    });

    return !!artistRoleMatch;
  }

  // Fallback: independent facet matching
  return (
    matchesSelectedValues(projectArtistTokens, selectedFilters.artist) &&
    matchesSelectedValues(projectRoles, selectedFilters.role)
  );
}

function FilterChip({ href, children, active = false }) {
  return (
    <Link
      href={href}
      className={`${styles.filterChip} ${active ? styles.filterChipActive : ""}`}
      data-cursor="hover"
      aria-current={active ? "true" : undefined}
    >
      {children}
    </Link>
  );
}

export default function ProjectsClient({ projects = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFilters = {
    category: parseFacetValues(searchParams, "category"),
    artist: parseFacetValues(searchParams, "artist"),
    role: parseFacetValues(searchParams, "role"),
  };

  const hasActiveFilters =
    selectedFilters.category.length > 0 ||
    selectedFilters.artist.length > 0 ||
    selectedFilters.role.length > 0;

  const facetOptions = useMemo(() => {
    const categories = new Map();
    const artists = new Map();
    const roles = new Map();

    projects.forEach((project) => {
      (Array.isArray(project.categories) ? project.categories : []).forEach(
        (category) => {
          const label = String(category || "").trim();
          if (!label) return;
          categories.set(label.toLowerCase(), label);
        },
      );

      getProjectArtistEntries(project).forEach((artist) => {
        const label = artist.name || artist.slug;
        if (!label) return;
        artists.set(normalizeText(label), label);
      });

      getProjectRoleLabels(project).forEach((role) => {
        const label = String(role || "").trim();
        if (!label) return;
        roles.set(label.toLowerCase(), label);
      });
    });

    return {
      category: Array.from(categories.values()).sort((a, b) =>
        a.localeCompare(b),
      ),
      artist: Array.from(artists.values()).sort((a, b) => a.localeCompare(b)),
      role: Array.from(roles.values()).sort((a, b) => a.localeCompare(b)),
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!hasActiveFilters) return projects;
    return projects.filter((project) =>
      matchesProjectFilters(project, selectedFilters),
    );
  }, [projects, hasActiveFilters, selectedFilters]);

  const clearAllHref = buildProjectsHref(searchParams, {});

  const facetGroups = [
    {
      key: "category",
      title: "Categories",
      values: facetOptions.category,
    },
    {
      key: "artist",
      title: "Artists",
      values: facetOptions.artist,
    },
    {
      key: "role",
      title: "Roles",
      values: facetOptions.role,
    },
  ];

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

        <section className={styles.filtersPanel} aria-label="Project filters">
          <div className={styles.filterPills}>
            <FilterChip href="/projects" active={!hasActiveFilters}>
              All Projects
            </FilterChip>
            <span className={styles.filterHint}>
              Select multiple chips to stack filters.
            </span>
          </div>

          {hasActiveFilters && (
            <div className={styles.activeFilterRow}>
              <span className={styles.activeFilterLabel}>Active filters</span>
              <div className={styles.activeFilterChips}>
                {activeFilterChips.map((chip) => (
                  <FilterChip
                    key={chip.key}
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
              <Link href={clearAllHref} className={styles.clearFilterLink}>
                Clear all
              </Link>
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
            {filteredProjects.map((project) => {
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
                        src={imageSrc}
                        alt={project.title}
                        className={styles.media}
                        width={1600}
                        height={900}
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
      </div>
    </main>
  );
}
