import { cacheTag } from "next/cache";
import firestore from "./firestore.js";
import {
  createFallbackClientLogos,
  mergeClientLogos,
  normalizeClientLogoItems,
} from "./clientLogos.js";
import { listFolderResources, destroyByPublicId } from "./cloudinary.js";
import { normalizeProjectArtistRoles } from "./projectArtists.js";
import { normalizeCategoryList } from "./categories.js";
import { ARTISTS_TAG, CLIENT_LOGOS_TAG, PROJECTS_TAG } from "./cache.js";

function isFirestoreReady() {
  return Boolean(firestore && firestore.db && firestore.collections);
}

function isQuotaExceededError(error) {
  return (
    error?.code === 8 ||
    error?.code === "RESOURCE_EXHAUSTED" ||
    error?.code === "resource-exhausted" ||
    String(error?.message || "").includes("RESOURCE_EXHAUSTED")
  );
}

function toDoc(data) {
  if (!data) return null;
  return {
    ...data,
    id: data.id,
    categories: normalizeCategoryList(data.categories),
    subcategories: normalizeCategoryList(data.subcategories),
  };
}

function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeArtistSlugList(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (item && typeof item === "object") {
          return [item.slug || item.name].filter(Boolean);
        }
        return [item];
      })
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const slug = value.trim();
    return slug ? [slug] : [];
  }

  return [];
}

function sortProjectsByCreatedAtDesc(projects) {
  return projects.sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

function projectMatchesArtist(project, artistSlug) {
  const targetSlug = normalizeSlug(artistSlug);
  if (!targetSlug) return false;

  const projectSlugs = normalizeArtistSlugList(project.artistSlugs).map(
    normalizeSlug,
  );
  return projectSlugs.includes(targetSlug);
}

async function getArtistsLookup() {
  const artists = await getArtists();
  return new Map(artists.map((artist) => [normalizeSlug(artist.slug), artist]));
}

async function readProjectsFromFirestore() {
  "use cache";
  cacheTag(PROJECTS_TAG);
  cacheTag(ARTISTS_TAG);

  try {
    const snap = await firestore.collections.projects.get();
    const projects = snap.docs.map((doc) => toDoc(doc.data()));
    const artistsLookup = await getArtistsLookup();
    return sortProjectsByCreatedAtDesc(
      enrichProjectsWithArtists(projects, artistsLookup),
    );
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn(
        "Firestore quota exceeded while reading projects; using empty homepage project list",
      );
      return [];
    }

    throw error;
  }
}

async function readArtistsFromFirestore() {
  "use cache";
  cacheTag(ARTISTS_TAG);

  try {
    const snap = await firestore.collections.artists.get();
    const artists = snap.docs.map((doc) => toDoc(doc.data()));
    return artists.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn(
        "Firestore quota exceeded while reading artists; using empty homepage artist list",
      );
      return [];
    }

    throw error;
  }
}

function enrichProjectWithArtists(project, artistsLookup) {
  const artistSlugs = normalizeArtistSlugList(project.artistSlugs);
  const artists = artistSlugs.map((slug) => {
    const artist = artistsLookup.get(normalizeSlug(slug));
    if (artist) {
      return {
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
      };
    }
    return {
      name: slug,
      slug,
    };
  });

  return {
    ...project,
    artistSlugs,
    artists,
    artistNames: artists.map((artist) => artist.name).filter(Boolean),
  };
}

function enrichProjectsWithArtists(projects, artistsLookup) {
  return projects.map((project) =>
    enrichProjectWithArtists(project, artistsLookup),
  );
}

async function getNextIdFirestore(collection) {
  const q = await collection.orderBy("id", "desc").limit(1).get();
  if (q.empty) return 1;
  const d = q.docs[0].data();
  return Number(d.id || 0) + 1;
}

export async function getProjects() {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  return readProjectsFromFirestore();
}

function encodeProjectsCursor(data) {
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
}

function decodeProjectsCursor(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed.createdAt || !parsed.documentId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeSearchTerm(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 1)[0] || "";
}

export function buildProjectSearchTokens(input = {}) {
  return [
    input.title,
    input.description,
    ...(Array.isArray(input.categories) ? input.categories : []),
    ...(Array.isArray(input.subcategories) ? input.subcategories : []),
    ...(Array.isArray(input.artistSlugs) ? input.artistSlugs : []),
    ...getProjectRoleTokens(input),
  ]
    .flatMap((value) => String(value || "").toLowerCase().match(/[a-z0-9]+/g) || [])
    .filter((value, index, values) => values.indexOf(value) === index);
}

function projectMatchesRole(project, role) {
  const roles = (Array.isArray(role) ? role : [role])
    .map((value) => normalizeSlug(value))
    .filter(Boolean);
  if (roles.length === 0) return true;
  const projectRoles = getProjectRoleTokens(project);
  return roles.some((value) => projectRoles.includes(value));
}

function projectMatchesPageFilters(project, categories, artists, role) {
  const projectCategories = normalizeCategoryList(project.categories).map(String);
  const projectArtists = normalizeArtistSlugList(project.artistSlugs).map(String);
  const categoryMatch =
    categories.length === 0 || categories.some((value) => projectCategories.includes(value));
  const artistMatch =
    artists.length === 0 || artists.some((value) => projectArtists.includes(value));
  return categoryMatch && artistMatch && projectMatchesRole(project, role);
}

function projectMatchesSearch(project, query) {
  const haystack = [
    project.title,
    project.description,
    ...normalizeCategoryList(project.categories),
    ...normalizeCategoryList(project.subcategories),
    ...normalizeArtistSlugList(project.artistSlugs),
    ...getProjectRoleTokens(project),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function getProjectRoleTokens(project) {
  const roles = normalizeProjectArtistRoles(project.artistRoles);
  return roles.flatMap((entry) =>
    (Array.isArray(entry.roles) ? entry.roles : [])
      .map(normalizeSlug)
      .filter(Boolean),
  );
}

/**
 * Bounded, cursor-based project reads for public archive pages.
 * Category and artist filters are applied by Firestore. Role filtering is
 * retained as a bounded server-side filter because legacy documents store
 * roles nested inside artistRoles.
 */
async function getProjectsPageInternal({
  limit = 12,
  cursor = "",
  category = [],
  artist = [],
  role = [],
  query = "",
} = {}) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");

  const pageSize = Math.min(Math.max(Number(limit) || 12, 1), 24);
  const normalizedCategories = (Array.isArray(category) ? category : [category])
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const normalizedArtists = (Array.isArray(artist) ? artist : [artist])
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const normalizedQuery = normalizeSearchTerm(query);
  const normalizedRoles = (Array.isArray(role) ? role : [role])
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const decodedCursor = decodeProjectsCursor(cursor);
  const queryRef = firestore.collections.projects;

  let firestoreQuery = queryRef;
  if (normalizedQuery) {
    firestoreQuery = firestoreQuery.where(
      "searchTokens",
      "array-contains",
      normalizedQuery,
    );
  } else if (normalizedCategories.length === 1) {
    firestoreQuery = firestoreQuery.where(
      "categories",
      "array-contains",
      normalizedCategories[0],
    );
  } else if (normalizedCategories.length > 1) {
    firestoreQuery = firestoreQuery.where(
      "categories",
      "array-contains-any",
      normalizedCategories.slice(0, 30),
    );
  } else if (normalizedArtists.length === 1) {
    firestoreQuery = firestoreQuery.where(
      "artistSlugs",
      "array-contains",
      normalizedArtists[0],
    );
  } else if (normalizedArtists.length > 1) {
    firestoreQuery = firestoreQuery.where(
      "artistSlugs",
      "array-contains-any",
      normalizedArtists.slice(0, 30),
    );
  }

  firestoreQuery = firestoreQuery
    .orderBy("createdAt", "desc");

  if (decodedCursor) {
    firestoreQuery = firestoreQuery.startAfter(decodedCursor.createdAt);
  }

  // Fetch a small bounded overscan for legacy nested role data, never the
  // entire collection. Search tokens are added to new/updated documents and
  // can be backfilled once with the migration script.
  const boundedLimit = normalizedRoles.length ? pageSize * 3 + 1 : pageSize + 1;
  let snap;
  let usedIndexFallback = false;
  try {
    snap = await firestoreQuery.limit(boundedLimit).get();
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    const missingIndex = error?.code === 9 || message.includes("failed_precondition");
    if (!missingIndex) throw error;
    usedIndexFallback = true;

    // Vercel deploys application code separately from Firebase indexes. Keep
    // filters usable during that short rollout window without crashing the
    // route; the indexed query becomes active once indexes are deployed.
    snap = await queryRef
      .orderBy("createdAt", "desc")
      .limit(Math.min(boundedLimit * 4, 100))
      .get();
  }
  let rawDocs = snap.docs;
  const artistsLookup = await getArtistsLookup();
  let projects = rawDocs
    .map((doc) => toDoc({ id: doc.id, ...doc.data() }))
    .filter((project) =>
      projectMatchesPageFilters(project, normalizedCategories, normalizedArtists, normalizedRoles),
    )
    .filter((project) => !normalizedQuery || projectMatchesSearch(project, normalizedQuery))
    .slice(0, pageSize)
    .map((project) => enrichProjectWithArtists(project, artistsLookup));

  // Existing records may predate searchTokens. Fall back to the already
  // cached collection only for a search request so old projects remain
  // discoverable while the one-time backfill is performed.
  if (normalizedQuery && projects.length === 0) {
    projects = (await readProjectsFromFirestore())
      .filter((project) =>
        projectMatchesPageFilters(project, normalizedCategories, normalizedArtists, normalizedRoles),
      )
      .filter((project) => projectMatchesSearch(project, normalizedQuery))
      .slice(0, pageSize);
    rawDocs = [];
  }

  const lastDoc = rawDocs[rawDocs.length - 1];
  const hasMore = !usedIndexFallback && rawDocs.length > pageSize;
  return {
    projects,
    hasMore,
    nextCursor:
      hasMore && lastDoc
        ? encodeProjectsCursor({
            createdAt: lastDoc.get("createdAt"),
            documentId: lastDoc.id,
          })
        : null,
  };
}

export async function getProjectsPage(options = {}) {
  try {
    return await getProjectsPageInternal(options);
  } catch (error) {
    if (!isQuotaExceededError(error)) throw error;

    // Keep public pages renderable during a Firestore quota incident. The
    // next request can recover automatically once the quota is restored.
    console.warn("Firestore quota exceeded while reading project page", error);
    return { projects: [], hasMore: false, nextCursor: null, degraded: true };
  }
}

export async function getProjectBySlug(slug) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  try {
    const q = await firestore.collections.projects
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (q.empty) return null;
    const project = toDoc({ id: q.docs[0].id, ...q.docs[0].data() });
    return enrichProjectWithArtists(project, await getArtistsLookup());
  } catch (error) {
    if (isQuotaExceededError(error)) return null;
    throw error;
  }
}

export async function getArtists() {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  return readArtistsFromFirestore();
}

export async function getArtistBySlug(slug) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const q = await firestore.collections.artists
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (q.empty) return null;
  return toDoc({ id: q.docs[0].id, ...q.docs[0].data() });
}

export async function getProjectsByArtist(artistSlug) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  try {
    const projects = await readProjectsFromFirestore();
    return projects.filter((project) =>
      projectMatchesArtist(project, artistSlug),
    );
  } catch (error) {
    if (isQuotaExceededError(error)) return [];
    throw error;
  }
}

export async function addProject(input) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const q = await firestore.collections.projects
    .where("slug", "==", input.slug)
    .limit(1)
    .get();
  if (!q.empty) throw new Error(`Project slug already exists: ${input.slug}`);

  const nextId = await getNextIdFirestore(firestore.collections.projects);
  const artistSlugs = normalizeArtistSlugList(input.artistSlugs);

  const project = {
    id: nextId,
    title: input.title,
    slug: input.slug,
    categories: normalizeCategoryList(input.categories),
    subcategories: normalizeCategoryList(input.subcategories),
    artistRoles: normalizeProjectArtistRoles(input.artistRoles),
    imageUrl: input.imageUrl ?? null,
    imageUrls: Array.isArray(input.imageUrls) ? input.imageUrls : [],
    previewImageUrl: input.previewImageUrl ?? null,
    videoUrl: input.videoUrl ?? null,
    videoUrls: Array.isArray(input.videoUrls) ? input.videoUrls : [],
    youtubeUrl: input.youtubeUrl ?? null,
    instagramUrl: input.instagramUrl ?? null,
    mediaType: input.mediaType ?? null,
    description: input.description ?? null,
    artistSlugs,
    searchTokens: buildProjectSearchTokens({
      title: input.title,
      description: input.description,
      categories: normalizeCategoryList(input.categories),
      subcategories: normalizeCategoryList(input.subcategories),
      artistSlugs,
      artistRoles: input.artistRoles,
    }),
    createdAt: new Date().toISOString(),
  };
  await firestore.collections.projects.add(project);
  return enrichProjectWithArtists(project, await getArtistsLookup());
}

export async function addArtist(input) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const q = await firestore.collections.artists
    .where("slug", "==", input.slug)
    .limit(1)
    .get();
  if (!q.empty) throw new Error(`Artist slug already exists: ${input.slug}`);
  const q2 = await firestore.collections.artists
    .where("name", "==", input.name)
    .limit(1)
    .get();
  if (!q2.empty) throw new Error(`Artist name already exists: ${input.name}`);

  const nextId = await getNextIdFirestore(firestore.collections.artists);
  const artist = {
    id: nextId,
    name: input.name,
    slug: input.slug,
    slogan: input.slogan ?? null,
    instagramUrl: input.instagramUrl ?? null,
    bio: input.bio ?? null,
    imageUrl: input.imageUrl ?? null,
    createdAt: new Date().toISOString(),
  };
  await firestore.collections.artists.add(artist);
  return artist;
}

export async function deleteArtist(id) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const numericId = Number(id);
  const q = await firestore.collections.artists
    .where("id", "==", numericId)
    .limit(1)
    .get();
  if (q.empty) return false;
  await q.docs[0].ref.delete();
  return true;
}

export async function updateArtist(id, input) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const numericId = Number(id);
  const q = await firestore.collections.artists
    .where("id", "==", numericId)
    .limit(1)
    .get();
  if (q.empty) throw new Error(`Artist not found: ${id}`);

  const docRef = q.docs[0].ref;
  const existing = q.docs[0].data();
  const updated = {
    ...existing,
    name: input.name,
    slug: input.slug,
    slogan: input.slogan ?? existing.slogan,
    instagramUrl: input.instagramUrl ?? existing.instagramUrl ?? null,
    bio: input.bio ?? existing.bio,
    imageUrl: input.imageUrl ?? existing.imageUrl ?? null,
    id: existing.id,
    createdAt: existing.createdAt,
  };
  await docRef.update(updated);
  return updated;
}

export async function updateProject(id, input) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const numericId = Number(id);

  const q = await firestore.collections.projects
    .where("id", "==", numericId)
    .limit(1)
    .get();
  if (q.empty) throw new Error(`Project not found: ${id}`);

  const docRef = q.docs[0].ref;
  const existing = q.docs[0].data();
  const artistSlugs = normalizeArtistSlugList(input.artistSlugs);

  const slugQ = await firestore.collections.projects
    .where("slug", "==", input.slug)
    .get();
  if (!slugQ.empty) {
    const conflict = slugQ.docs.find((doc) => doc.data().id !== numericId);
    if (conflict) throw new Error(`Project slug already exists: ${input.slug}`);
  }

  const existingWithoutLegacy = { ...existing };
  delete existingWithoutLegacy.artist;
  delete existingWithoutLegacy.artistSlug;
  const updated = {
    ...existingWithoutLegacy,
    title: input.title,
    slug: input.slug,
    categories: normalizeCategoryList(
      Array.isArray(input.categories)
        ? input.categories
        : existing.categories || [],
    ),
    subcategories: normalizeCategoryList(
      Array.isArray(input.subcategories)
        ? input.subcategories
        : existing.subcategories || [],
    ),
    artistRoles: normalizeProjectArtistRoles(
      input.artistRoles ?? existing.artistRoles ?? [],
    ),
    imageUrl: input.imageUrl ?? null,
    imageUrls: Array.isArray(input.imageUrls)
      ? input.imageUrls
      : existing.imageUrls || [],
    previewImageUrl: input.previewImageUrl ?? existing.previewImageUrl ?? null,
    videoUrl: input.videoUrl ?? null,
    videoUrls: Array.isArray(input.videoUrls)
      ? input.videoUrls
      : existing.videoUrls || [],
    youtubeUrl: input.youtubeUrl ?? existing.youtubeUrl ?? null,
    instagramUrl: input.instagramUrl ?? existing.instagramUrl ?? null,
    mediaType: input.mediaType ?? existing?.mediaType ?? null,
    description: input.description ?? null,
    artistSlugs,
    searchTokens: buildProjectSearchTokens({
      title: input.title,
      description: input.description,
      categories: normalizeCategoryList(input.categories),
      subcategories: normalizeCategoryList(input.subcategories),
      artistSlugs,
      artistRoles: input.artistRoles ?? existing.artistRoles,
    }),
    id: existing.id,
    createdAt: existing.createdAt,
  };
  await docRef.set(updated);
  return enrichProjectWithArtists(updated, await getArtistsLookup());
}

export async function deleteProject(id) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const numericId = Number(id);
  const q = await firestore.collections.projects
    .where("id", "==", numericId)
    .limit(1)
    .get();
  if (q.empty) return null;
  const existing = q.docs[0].data();
  await q.docs[0].ref.delete();
  return enrichProjectWithArtists(toDoc(existing), await getArtistsLookup());
}

export async function getSiteSettings() {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  return firestore.getSiteSettings();
}

export async function setSiteSettings(updates) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  return firestore.setSiteSettings(updates);
}

export async function getClientLogos() {
  "use cache";
  cacheTag(CLIENT_LOGOS_TAG);

  const fallbacks = createFallbackClientLogos();

  try {
    const resources = await listFolderResources("client_images", "image");
    const cloudinaryLogos = normalizeClientLogoItems(resources.resources).map(
      (item) => ({
        ...item,
        source: "cloudinary",
      }),
    );
    return mergeClientLogos(fallbacks, cloudinaryLogos);
  } catch {
    const logos = await firestore.getClientLogos();
    return mergeClientLogos(fallbacks, normalizeClientLogoItems(logos));
  }
}

export async function addClientLogos(logos) {
  const normalized = (Array.isArray(logos) ? logos : [])
    .map((logo) => {
      if (typeof logo === "string") return { url: logo };
      if (logo && typeof logo === "object")
        return { url: logo.url, source: logo.source || "upload" };
      return null;
    })
    .filter(Boolean);

  await firestore.addClientLogos(normalized);
  return firestore.getClientLogos();
}

export async function deleteClientLogo(publicId) {
  if (!publicId) return false;

  try {
    await destroyByPublicId(publicId, "image");
  } catch (error) {
    console.warn("deleteClientLogo: cloudinary delete failed", error?.message);
  }

  const snap = await firestore.collections.clients
    .where("publicId", "==", publicId)
    .limit(1)
    .get();
  if (!snap.empty) {
    await snap.docs[0].ref.delete();
  }

  return true;
}
