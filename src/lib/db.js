import firestore from "./firestore.js";
import {
  createFallbackClientLogos,
  mergeClientLogos,
  normalizeClientLogoItems,
} from "./clientLogos.js";
import { listFolderResources, destroyByPublicId } from "./cloudinary.js";

function isFirestoreReady() {
  return Boolean(firestore && firestore.db && firestore.collections);
}

function toDoc(data) {
  return data ? { id: data.id, ...data } : null;
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
  return new Map(
    artists.map((artist) => [normalizeSlug(artist.slug), artist]),
  );
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
  return projects.map((project) => enrichProjectWithArtists(project, artistsLookup));
}

async function getNextIdFirestore(collection) {
  const q = await collection.orderBy("id", "desc").limit(1).get();
  if (q.empty) return 1;
  const d = q.docs[0].data();
  return Number(d.id || 0) + 1;
}

export async function getProjects() {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const snap = await firestore.collections.projects.get();
  const projects = snap.docs.map((doc) => toDoc(doc.data()));
  const artistsLookup = await getArtistsLookup();
  return sortProjectsByCreatedAtDesc(
    enrichProjectsWithArtists(projects, artistsLookup),
  );
}

export async function getProjectBySlug(slug) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const q = await firestore.collections.projects
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (q.empty) return null;
  const project = toDoc(q.docs[0].data());
  const artistsLookup = await getArtistsLookup();
  return enrichProjectWithArtists(project, artistsLookup);
}

export async function getArtists() {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const snap = await firestore.collections.artists.get();
  const artists = snap.docs.map((doc) => toDoc(doc.data()));
  return artists.sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || "")),
  );
}

export async function getArtistBySlug(slug) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const q = await firestore.collections.artists
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (q.empty) return null;
  return toDoc(q.docs[0].data());
}

export async function getProjectsByArtist(artistSlug) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const snap = await firestore.collections.projects.get();
  const projects = snap.docs.map((doc) => toDoc(doc.data()));
  const artistsLookup = await getArtistsLookup();
  return sortProjectsByCreatedAtDesc(
    enrichProjectsWithArtists(
      projects.filter((project) => projectMatchesArtist(project, artistSlug)),
      artistsLookup,
    ),
  );
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
    categories: Array.isArray(input.categories) ? input.categories : [],
    subcategories: Array.isArray(input.subcategories)
      ? input.subcategories
      : [],
    artistRoles: Array.isArray(input.artistRoles) ? input.artistRoles : [],
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
    categories: Array.isArray(input.categories)
      ? input.categories
      : existing.categories || [],
    subcategories: Array.isArray(input.subcategories)
      ? input.subcategories
      : existing.subcategories || [],
    artistRoles: Array.isArray(input.artistRoles)
      ? input.artistRoles
      : existing.artistRoles || [],
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
  const settings = await firestore.getSiteSettings();
  return settings || {};
}

export async function setSiteSettings(updates) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  return firestore.setSiteSettings(updates);
}

export async function getClientLogos() {
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
