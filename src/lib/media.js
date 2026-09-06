export function normalizeMediaUrl(value) {
  if (typeof value !== "string") return value;
  return value.replace(/^http:\/\/res\.cloudinary\.com\//i, "https://res.cloudinary.com/");
}

function addCloudinaryTransform(url, transform) {
  const normalized = normalizeMediaUrl(url);
  if (!normalized || !normalized.includes("res.cloudinary.com/")) return normalized;
  if (/\/upload\/[^/]*(?:f_auto|q_auto|w_\d+)/.test(normalized)) return normalized;
  return normalized.replace("/upload/", `/upload/${transform}/`);
}

export function optimizeImageUrl(value, width = 1600) {
  return addCloudinaryTransform(value, `f_auto,q_auto,c_limit,w_${width}`);
}

export function optimizeVideoUrl(value, width = 1280) {
  return addCloudinaryTransform(value, `f_auto,q_auto,c_limit,w_${width}`);
}
