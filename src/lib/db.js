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
  return projects.sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

export async function getProjectBySlug(slug) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const q = await firestore.collections.projects
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (q.empty) return null;
  return toDoc(q.docs[0].data());
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
  const snap = await firestore.collections.projects
    .where("artistSlug", "==", artistSlug)
    .get();
  return snap.docs.map((doc) => toDoc(doc.data()));
}

export async function addProject(input) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const q = await firestore.collections.projects
    .where("slug", "==", input.slug)
    .limit(1)
    .get();
  if (!q.empty) throw new Error(`Project slug already exists: ${input.slug}`);

  const nextId = await getNextIdFirestore(firestore.collections.projects);

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
    description: input.description ?? null,
    artist: input.artist,
    artistSlug: input.artistSlug,
    createdAt: new Date().toISOString(),
  };
  await firestore.collections.projects.add(project);
  return project;
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

  const slugQ = await firestore.collections.projects
    .where("slug", "==", input.slug)
    .get();
  if (!slugQ.empty) {
    const conflict = slugQ.docs.find((doc) => doc.data().id !== numericId);
    if (conflict) throw new Error(`Project slug already exists: ${input.slug}`);
  }

  const updated = {
    ...existing,
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
    description: input.description ?? null,
    artist: input.artist,
    artistSlug: input.artistSlug,
    id: existing.id,
    createdAt: existing.createdAt,
  };
  await docRef.update(updated);
  return updated;
}

export async function deleteProject(id) {
  if (!isFirestoreReady()) throw new Error("Firestore not initialized");
  const numericId = Number(id);
  const q = await firestore.collections.projects
    .where("id", "==", numericId)
    .limit(1)
    .get();
  if (q.empty) return false;
  await q.docs[0].ref.delete();
  return true;
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
