export function getProjectExternalUrl(project) {
  if (!project) return null;

  const instagramUrl = normalizeInstagramUrl(project.instagramUrl);
  if (instagramUrl) return instagramUrl;

  return normalizeYouTubeUrl(
    project.youtubeUrl ||
      project.videoUrl ||
      (Array.isArray(project.videoUrls) ? project.videoUrls[0] : null),
  );
}

export function getProjectExternalLabel(project) {
  const url = getProjectExternalUrl(project);
  if (!url) return "View Project";
  const lower = url.toLowerCase();
  if (lower.includes("instagram.com")) return "View on Instagram";
  if (lower.includes("youtube.com") || lower.includes("youtu.be"))
    return "Watch on YouTube";
  return "View Project";
}

export function normalizeInstagramUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname.includes("instagram.com")) return trimmed;
    parsed.search = "";
    parsed.hash = "";
    parsed.pathname = parsed.pathname.replace(/\/embed\/?$/i, "/");
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

export function normalizeYouTubeUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const idMatch = trimmed.match(
    /(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (idMatch?.[1]) return `https://www.youtube.com/watch?v=${idMatch[1]}`;

  if (/^[A-Za-z0-9_-]{6,}$/.test(trimmed)) {
    return `https://www.youtube.com/watch?v=${trimmed}`;
  }

  return trimmed;
}
