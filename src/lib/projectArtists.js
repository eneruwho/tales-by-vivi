function normalizeArtistEntry(artist) {
  if (!artist) return null;

  if (typeof artist === "string") {
    const slug = artist.trim();
    if (!slug) return null;
    return { slug, name: slug };
  }

  if (typeof artist === "object") {
    const slug = String(artist.slug || "").trim();
    const name = String(artist.name || "").trim();
    if (!slug && !name) return null;
    return {
      slug: slug || name,
      name: name || slug,
    };
  }

  return null;
}

function normalizeRoleList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return normalizeRoleList(parsed);
      }
    } catch {
      // ignore JSON parse failures and fall back to comma-separated text
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeArtistRoleEntry(entry) {
  if (!entry) return null;

  if (typeof entry === "string") {
    const roles = normalizeRoleList(entry);
    if (roles.length === 0) return null;
    return {
      slug: "",
      name: "",
      roles,
    };
  }

  if (Array.isArray(entry)) {
    const roles = normalizeRoleList(entry);
    if (roles.length === 0) return null;
    return {
      slug: "",
      name: "",
      roles,
    };
  }

  if (typeof entry === "object") {
    const slug = String(
      entry.slug || entry.artistSlug || entry.artist?.slug || "",
    ).trim();
    const name = String(
      entry.name || entry.artistName || entry.artist?.name || "",
    ).trim();
    const roles = normalizeRoleList(
      entry.roles ??
        entry.role ??
        entry.value ??
        entry.text ??
        entry.label ??
        entry.artistRoles,
    );

    if (!slug && !name && roles.length === 0) return null;

    return {
      slug: slug || name,
      name: name || slug,
      roles,
    };
  }

  return null;
}

export function getProjectArtistSlugs(project) {
  if (!project || !Array.isArray(project.artistSlugs)) return [];

  return project.artistSlugs
    .map((slug) => String(slug || "").trim())
    .filter(Boolean);
}

export function getProjectArtistEntries(project) {
  if (!project || !Array.isArray(project.artists)) return [];

  return project.artists.map(normalizeArtistEntry).filter(Boolean);
}

export function getProjectArtistNames(project) {
  return getProjectArtistEntries(project)
    .map((artist) => artist.name)
    .filter(Boolean);
}

export function getProjectArtistLabel(project, separator = " / ") {
  return getProjectArtistNames(project).join(separator);
}

export function getProjectArtistRoleEntries(project) {
  if (!project) return [];

  const raw = project.artistRoles;
  if (!raw) return [];

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map(normalizeArtistRoleEntry)
          .filter(Boolean);
      }
    } catch {
      // ignore JSON parse failures and fall back to legacy comma-separated text
    }

    const legacyRoles = normalizeRoleList(trimmed);
    if (legacyRoles.length === 0) return [];
    return [
      {
        slug: "",
        name: "",
        roles: legacyRoles,
      },
    ];
  }

  if (Array.isArray(raw)) {
    const isLegacyFlatList = raw.every((item) => typeof item === "string");
    if (isLegacyFlatList) {
      const legacyRoles = normalizeRoleList(raw);
      return legacyRoles.length > 0
        ? [{ slug: "", name: "", roles: legacyRoles }]
        : [];
    }

    return raw.map(normalizeArtistRoleEntry).filter(Boolean);
  }

  const entry = normalizeArtistRoleEntry(raw);
  return entry ? [entry] : [];
}

export function getProjectRoleLabels(project) {
  return getProjectArtistRoleEntries(project)
    .flatMap((entry) => (Array.isArray(entry.roles) ? entry.roles : []))
    .map((role) => String(role || "").trim())
    .filter(Boolean);
}

export function getProjectArtistRoleSummary(project) {
  return getProjectArtistRoleEntries(project)
    .map((entry) => {
      const roles = Array.isArray(entry.roles)
        ? entry.roles.map((role) => String(role || "").trim()).filter(Boolean)
        : [];
      if (!roles.length && entry.name) return entry.name;
      if (entry.name && roles.length > 0) {
        return `${entry.name}: ${roles.join(", ")}`;
      }
      if (roles.length > 0) return roles.join(", ");
      return null;
    })
    .filter(Boolean);
}

export function buildProjectArtistSelections(project, artists = []) {
  const knownArtists = new Map(
    (Array.isArray(artists) ? artists : []).map((artist) => [
      String(artist.slug || "").trim(),
      artist,
    ]),
  );

  const roleEntries = getProjectArtistRoleEntries(project);
  const roleMap = new Map(
    roleEntries
      .map((entry) => {
        const slug = String(entry.slug || "").trim();
        if (!slug) return null;
        return [slug, entry];
      })
      .filter(Boolean),
  );

  return getProjectArtistSlugs(project).map((slug) => {
    const artist = knownArtists.get(slug);
    const roleEntry = roleMap.get(slug);
    return artist
      ? {
          name: artist.name,
          slug: artist.slug,
          rolesText: roleEntry?.roles?.join(", ") || "",
        }
      : { name: slug, slug, rolesText: roleEntry?.roles?.join(", ") || "" };
  });
}

export function normalizeProjectArtistRoles(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return normalizeProjectArtistRoles(parsed);
    } catch {
      return normalizeRoleList(trimmed).map((role) => ({
        slug: "",
        name: "",
        roles: [role],
      }));
    }
  }

  if (Array.isArray(value)) {
    return value.map(normalizeArtistRoleEntry).filter(Boolean);
  }

  const entry = normalizeArtistRoleEntry(value);
  return entry ? [entry] : [];
}
