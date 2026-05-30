// Helpers to canonicalize and normalize category strings
function titleCaseWord(word) {
  if (!word) return word;
  // Preserve all-caps acronyms
  if (word.toUpperCase() === word && word.length <= 4) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function titleCase(phrase) {
  return phrase
    .split(/[\s-_]+/)
    .map(titleCaseWord)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

const CANONICAL_MAP = new Map([
  ["music video", "Music Video"],
  ["music-video", "Music Video"],
  ["mv", "Music Video"],
  ["commercial", "Commercial"],
  ["short film", "Short Film"],
  ["documentary", "Documentary"],
  ["photography", "Photography"],
  ["branding", "Branding"],
]);

function canonicalizeCategory(raw) {
  if (!raw && raw !== 0) return null;
  const s = String(raw || "").trim();
  if (!s) return null;
  const key = s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\s_\/\\|]+/g, " ")
    .trim();
  if (CANONICAL_MAP.has(key)) return CANONICAL_MAP.get(key);
  return titleCase(key);
}

export function normalizeCategoryList(value) {
  if (!value) return [];
  let items = [];
  if (Array.isArray(value)) {
    items = value.flatMap((v) =>
      typeof v === "string" ? v.split(/[,|\\/\n;]/) : [v],
    );
  } else if (typeof value === "string") {
    items = value.split(/[,|\\/\n;]/);
  } else {
    items = [String(value)];
  }

  const out = items
    .map((it) => canonicalizeCategory(it))
    .filter(Boolean)
    .map((it) => it.trim());

  // unique preserve order
  const seen = new Set();
  const unique = [];
  for (const it of out) {
    if (!seen.has(it)) {
      seen.add(it);
      unique.push(it);
    }
  }
  return unique;
}

export function canonicalizeCategoryListToString(value) {
  return normalizeCategoryList(value).join(", ");
}

const categories = {
  normalizeCategoryList,
  canonicalizeCategoryListToString,
  canonicalizeCategory,
};

export default categories;
