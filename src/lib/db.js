import fs from "fs/promises";
import path from "path";
import firestore from "./firestore";
import {
  createFallbackClientLogos,
  mergeClientLogos,
  normalizeClientLogoItems,
} from "./clientLogos";
import {
  destroyByPublicId,
  listFolderResources,
} from "./cloudinary";

const dataPath = path.join(process.cwd(), "data.json");

const emptyStore = {
  projects: [],
  artists: [],
  siteSettings: {},
  clientLogos: [],
};

async function ensureStore() {
  try {
    await fs.access(dataPath);
  } catch {
    try {
      await fs.writeFile(dataPath, JSON.stringify(emptyStore, null, 2), "utf8");
    } catch (err) {
      console.error("db.ensureStore: failed to create data file", {
        path: dataPath,
        code: err && err.code,
        message: err && err.message,
      });
      throw new Error(
        `Persistent storage unavailable: cannot create ${dataPath} (${err && err.code}). Use an external DB in production.`,
      );
    }
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(dataPath, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return {
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      artists: Array.isArray(parsed.artists) ? parsed.artists : [],
      siteSettings:
        parsed.siteSettings && typeof parsed.siteSettings === "object"
          ? parsed.siteSettings
          : {},
      clientLogos: Array.isArray(parsed.clientLogos) ? parsed.clientLogos : [],
    };
  } catch {
    return { ...emptyStore };
  }
}

async function writeStore(store) {
  try {
    await fs.writeFile(dataPath, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("db.writeStore: failed to write data file", {
      path: dataPath,
      code: err && err.code,
      message: err && err.message,
    });
    throw new Error(
      `Persistent storage unavailable: cannot write to ${dataPath} (${err && err.code}). Use an external DB in production.`,
    );
  }
}

function getNextId(items) {
  return (
    items.reduce((maxId, item) => {
      const id = Number(item.id) || 0;
      return Math.max(maxId, id);
    }, 0) + 1
  );
}

async function getNextIdFirestore(collection) {
  const q = await collection.orderBy("id", "desc").limit(1).get();
  if (q.empty) return 1;
  const d = q.docs[0].data();
  return Number(d.id || 0) + 1;
}

function isFirestoreReady() {
  return Boolean(firestore && firestore.db && firestore.collections);
}

function toDoc(data) {
  return data ? { id: data.id, ...data } : null;
}

export async function getProjects() {
  if (isFirestoreReady()) {
    const snap = await firestore.collections.projects.get();
    const projects = snap.docs.map((doc) => toDoc(doc.data()));
    return projects.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }

  const store = await readStore();
  return [...store.projects].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

export async function getProjectBySlug(slug) {
  if (isFirestoreReady()) {
    const q = await firestore.collections.projects
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (q.empty) return null;
    return toDoc(q.docs[0].data());
  }

  const store = await readStore();
  return store.projects.find((project) => project.slug === slug) || null;
}

export async function getArtists() {
  if (isFirestoreReady()) {
    const snap = await firestore.collections.artists.get();
    const artists = snap.docs.map((doc) => toDoc(doc.data()));
    return artists.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || "")),
    );
  }

  const store = await readStore();
  return [...store.artists].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || "")),
  );
}

export async function getArtistBySlug(slug) {
  if (isFirestoreReady()) {
    const q = await firestore.collections.artists
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (q.empty) return null;
    return toDoc(q.docs[0].data());
  }

  const store = await readStore();
  return store.artists.find((artist) => artist.slug === slug) || null;
}

export async function getProjectsByArtist(artistSlug) {
  if (isFirestoreReady()) {
    const snap = await firestore.collections.projects
      .where("artistSlug", "==", artistSlug)
      .get();
    return snap.docs.map((doc) => toDoc(doc.data()));
  }

  const store = await readStore();
  return store.projects.filter((project) => project.artistSlug === artistSlug);
}

export async function addProject(input) {
  if (isFirestoreReady()) {
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
      category: input.category,
      imageUrl: input.imageUrl,
      imageUrls: Array.isArray(input.imageUrls) ? input.imageUrls : [],
      videoUrl: input.videoUrl ?? null,
      videoUrls: Array.isArray(input.videoUrls) ? input.videoUrls : [],
      description: input.description ?? null,
      artist: input.artist,
      artistSlug: input.artistSlug,
      createdAt: new Date().toISOString(),
    };
    await firestore.collections.projects.add(project);
    return project;
  }

  const store = await readStore();

  if (store.projects.some((project) => project.slug === input.slug)) {
    throw new Error(`Project slug already exists: ${input.slug}`);
  }

  const project = {
    id: getNextId(store.projects),
    title: input.title,
    slug: input.slug,
    category: input.category,
    imageUrl: input.imageUrl,
    imageUrls: Array.isArray(input.imageUrls) ? input.imageUrls : [],
    videoUrl: input.videoUrl ?? null,
    videoUrls: Array.isArray(input.videoUrls) ? input.videoUrls : [],
    description: input.description ?? null,
    artist: input.artist,
    artistSlug: input.artistSlug,
    createdAt: new Date().toISOString(),
  };

  store.projects.push(project);
  await writeStore(store);

  return project;
}

export async function addArtist(input) {
  if (isFirestoreReady()) {
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
      bio: input.bio ?? null,
      imageUrl: input.imageUrl ?? null,
      createdAt: new Date().toISOString(),
    };
    await firestore.collections.artists.add(artist);
    return artist;
  }

  const store = await readStore();

  if (store.artists.some((artist) => artist.slug === input.slug)) {
    throw new Error(`Artist slug already exists: ${input.slug}`);
  }

  if (store.artists.some((artist) => artist.name === input.name)) {
    throw new Error(`Artist name already exists: ${input.name}`);
  }

  const artist = {
    id: getNextId(store.artists),
    name: input.name,
    slug: input.slug,
    slogan: input.slogan ?? null,
    bio: input.bio ?? null,
    imageUrl: input.imageUrl ?? null,
    createdAt: new Date().toISOString(),
  };

  store.artists.push(artist);
  await writeStore(store);

  return artist;
}

export async function deleteArtist(id) {
  const numericId = Number(id);

  if (isFirestoreReady()) {
    const q = await firestore.collections.artists
      .where("id", "==", numericId)
      .limit(1)
      .get();
    if (q.empty) return false;
    await q.docs[0].ref.delete();
    return true;
  }

  const store = await readStore();
  const initialLength = store.artists.length;
  store.artists = store.artists.filter(
    (artist) => Number(artist.id) !== numericId,
  );
  if (store.artists.length === initialLength) return false;
  await writeStore(store);
  return true;
}

export async function updateArtist(id, input) {
  const numericId = Number(id);

  if (isFirestoreReady()) {
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

  const store = await readStore();
  const idx = store.artists.findIndex((a) => Number(a.id) === numericId);
  if (idx === -1) throw new Error(`Artist not found: ${id}`);

  const existing = store.artists[idx];
  store.artists[idx] = {
    ...existing,
    name: input.name,
    slug: input.slug,
    slogan: input.slogan ?? existing.slogan,
    bio: input.bio ?? existing.bio,
    imageUrl: input.imageUrl ?? existing.imageUrl ?? null,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  await writeStore(store);
  return store.artists[idx];
}

export async function updateProject(id, input) {
  const numericId = Number(id);

  if (isFirestoreReady()) {
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
      if (conflict)
        throw new Error(`Project slug already exists: ${input.slug}`);
    }

    const updated = {
      ...existing,
      title: input.title,
      slug: input.slug,
      category: input.category,
      imageUrl: input.imageUrl,
      imageUrls: Array.isArray(input.imageUrls)
        ? input.imageUrls
        : existing.imageUrls || [],
      videoUrl: input.videoUrl ?? null,
      videoUrls: Array.isArray(input.videoUrls)
        ? input.videoUrls
        : existing.videoUrls || [],
      description: input.description ?? null,
      artist: input.artist,
      artistSlug: input.artistSlug,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    await docRef.update(updated);
    return updated;
  }

  const store = await readStore();
  const projectIndex = store.projects.findIndex(
    (project) => Number(project.id) === numericId,
  );
  if (projectIndex === -1) {
    throw new Error(`Project not found: ${id}`);
  }

  const slugTaken = store.projects.some(
    (project) =>
      project.slug === input.slug && Number(project.id) !== numericId,
  );
  if (slugTaken) {
    throw new Error(`Project slug already exists: ${input.slug}`);
  }

  const existing = store.projects[projectIndex];
  store.projects[projectIndex] = {
    ...existing,
    title: input.title,
    slug: input.slug,
    category: input.category,
    imageUrl: input.imageUrl,
    imageUrls: Array.isArray(input.imageUrls)
      ? input.imageUrls
      : existing.imageUrls || [],
    videoUrl: input.videoUrl ?? null,
    videoUrls: Array.isArray(input.videoUrls)
      ? input.videoUrls
      : existing.videoUrls || [],
    description: input.description ?? null,
    artist: input.artist,
    artistSlug: input.artistSlug,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  await writeStore(store);
  return store.projects[projectIndex];
}

export async function deleteProject(id) {
  const numericId = Number(id);

  if (isFirestoreReady()) {
    const q = await firestore.collections.projects
      .where("id", "==", numericId)
      .limit(1)
      .get();
    if (q.empty) return false;
    await q.docs[0].ref.delete();
    return true;
  }

  const store = await readStore();
  const initialLength = store.projects.length;
  store.projects = store.projects.filter(
    (project) => Number(project.id) !== numericId,
  );

  if (store.projects.length === initialLength) {
    return false;
  }

  await writeStore(store);
  return true;
}

export async function getSiteSettings() {
  if (isFirestoreReady()) {
    const settings = await firestore.getSiteSettings();
    return settings || {};
  }

  const store = await readStore();
  return store.siteSettings || {};
}

export async function setSiteSettings(updates) {
  if (isFirestoreReady()) {
    return firestore.setSiteSettings(updates);
  }

  const store = await readStore();
  store.siteSettings = {
    ...(store.siteSettings || {}),
    ...(updates || {}),
  };
  await writeStore(store);
  return store.siteSettings;
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
    if (isFirestoreReady()) {
      const logos = await firestore.getClientLogos();
      return mergeClientLogos(fallbacks, normalizeClientLogoItems(logos));
    }

    const store = await readStore();
    return mergeClientLogos(fallbacks, normalizeClientLogoItems(store.clientLogos || []));
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

  if (isFirestoreReady()) {
    await firestore.addClientLogos(normalized);
    return firestore.getClientLogos();
  }

  return normalized;
}

export async function deleteClientLogo(publicId) {
  if (!publicId) return false;

  try {
    await destroyByPublicId(publicId, "image");
  } catch (error) {
    console.warn("deleteClientLogo: cloudinary delete failed", error?.message);
  }

  if (isFirestoreReady()) {
    const snap = await firestore.collections.clients
      .where("publicId", "==", publicId)
      .limit(1)
      .get();
    if (!snap.empty) {
      await snap.docs[0].ref.delete();
    }
  }

  return true;
}
