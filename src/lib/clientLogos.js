export const CLIENT_FALLBACK_LOGOS = [
  "asianpaints.png",
  "bewakoof.png",
  "dhampur.png",
  "donjulio.png",
  "doritos.png",
  "eno.png",
  "hoichoi.png",
  "indigo.png",
  "inreco.png",
  "koshekosha.png",
  "mioamore.png",
  "oppo.png",
  "pcchandra.png",
  "pgv.png",
  "porter.png",
  "rapido.png",
  "redpaste.png",
  "secrettemptation.png",
  "smartbazaar.png",
  "svf.png",
  "tatacliq.png",
  "theobroma.png",
  "tuborg.png",
  "vivo.png",
  "wildstone.png",
  "wowmomo.png",
  "zivame.png",
  "zomato.png",
];

export function createFallbackClientLogos() {
  return CLIENT_FALLBACK_LOGOS.map((file) => ({
    url: `/clients/${file}`,
    source: "fallback",
    publicId: null,
  }));
}

export function normalizeClientLogoItems(items = []) {
  return items
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        return { url: item, publicId: null, source: "uploaded" };
      }

      return {
        url: item.url || item.secure_url || null,
        publicId: item.publicId || item.public_id || null,
        source: item.source || "uploaded",
      };
    })
    .filter((item) => Boolean(item && item.url));
}

export function mergeClientLogos(...groups) {
  const seen = new Set();
  const merged = [];

  groups.flat().forEach((item) => {
    if (!item || !item.url) return;
    const key = item.publicId || item.url;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });

  return merged;
}
