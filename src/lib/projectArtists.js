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

export function buildProjectArtistSelections(project, artists = []) {
  const knownArtists = new Map(
    (Array.isArray(artists) ? artists : []).map((artist) => [
      String(artist.slug || "").trim(),
      artist,
    ]),
  );

  return getProjectArtistSlugs(project).map((slug) => {
    const artist = knownArtists.get(slug);
    return artist
      ? { name: artist.name, slug: artist.slug }
      : { name: slug, slug };
  });
}
