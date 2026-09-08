import { cacheTag } from "next/cache";
import supabaseClient, { supabase, isSupabaseReady } from "./supabase.js";
import {
  createFallbackClientLogos,
  mergeClientLogos,
  normalizeClientLogoItems,
} from "./clientLogos.js";
import { listFolderResources, destroyByPublicId } from "./cloudinary.js";
import { normalizeProjectArtistRoles } from "./projectArtists.js";
import { normalizeCategoryList } from "./categories.js";
import { ARTISTS_TAG, CLIENT_LOGOS_TAG, PROJECTS_TAG } from "./cache.js";

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

function rowToProject(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    title: row.title,
    slug: row.slug,
    categories: normalizeCategoryList(row.categories),
    subcategories: normalizeCategoryList(row.subcategories),
    artistRoles: normalizeProjectArtistRoles(row.artist_roles),
    imageUrl: row.image_url ?? null,
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls : [],
    previewImageUrl: row.preview_image_url ?? null,
    videoUrl: row.video_url ?? null,
    videoUrls: Array.isArray(row.video_urls) ? row.video_urls : [],
    youtubeUrl: row.youtube_url ?? null,
    instagramUrl: row.instagram_url ?? null,
    mediaType: row.media_type ?? null,
    description: row.description ?? null,
    artistSlugs: normalizeArtistSlugList(row.artist_slugs),
    searchTokens: Array.isArray(row.search_tokens) ? row.search_tokens : [],
    createdAt: row.created_at,
  };
}

function rowToArtist(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    slogan: row.slogan ?? null,
    bio: row.bio ?? null,
    instagramUrl: row.instagram_url ?? null,
    imageUrl: row.image_url ?? null,
    createdAt: row.created_at,
  };
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

async function readProjectsFromSupabase() {
  "use cache";
  cacheTag(PROJECTS_TAG);
  cacheTag(ARTISTS_TAG);

  if (!isSupabaseReady()) {
    console.warn("Supabase not initialized; returning empty project list");
    return [];
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error reading projects from Supabase:", error);
    return [];
  }

  const projects = (data || []).map(rowToProject);
  const artistsLookup = await getArtistsLookup();
  return sortProjectsByCreatedAtDesc(
    enrichProjectsWithArtists(projects, artistsLookup),
  );
}

async function readArtistsFromSupabase() {
  "use cache";
  cacheTag(ARTISTS_TAG);

  if (!isSupabaseReady()) {
    console.warn("Supabase not initialized; returning empty artist list");
    return [];
  }

  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error reading artists from Supabase:", error);
    return [];
  }

  return (data || []).map(rowToArtist);
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

export async function getProjects() {
  return readProjectsFromSupabase();
}

function encodeProjectsCursor(data) {
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
}

function decodeProjectsCursor(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed.createdAt) return null;
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

async function getProjectsPageInternal({
  limit = 12,
  cursor = "",
  category = [],
  artist = [],
  role = [],
  query = "",
} = {}) {
  if (!isSupabaseReady()) {
    console.warn("Supabase not initialized; returning empty project page");
    return { projects: [], hasMore: false, nextCursor: null, degraded: true };
  }

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

  let queryBuilder = supabase.from("projects").select("*");

  if (normalizedQuery) {
    queryBuilder = queryBuilder.contains("search_tokens", [normalizedQuery]);
  } else if (normalizedCategories.length > 0) {
    queryBuilder = queryBuilder.overlaps("categories", normalizedCategories);
  } else if (normalizedArtists.length > 0) {
    queryBuilder = queryBuilder.overlaps("artist_slugs", normalizedArtists);
  }

  queryBuilder = queryBuilder.order("created_at", { ascending: false });

  if (decodedCursor && decodedCursor.createdAt) {
    queryBuilder = queryBuilder.lt("created_at", decodedCursor.createdAt);
  }

  const fetchLimit = normalizedRoles.length ? pageSize * 3 + 1 : pageSize + 1;
  queryBuilder = queryBuilder.limit(fetchLimit);

  const { data: rows, error } = await queryBuilder;
  if (error) throw error;

  const rawProjects = (rows || []).map(rowToProject);
  const artistsLookup = await getArtistsLookup();

  let projects = rawProjects
    .filter((project) =>
      projectMatchesPageFilters(project, normalizedCategories, normalizedArtists, normalizedRoles),
    )
    .filter((project) => !normalizedQuery || projectMatchesSearch(project, normalizedQuery))
    .slice(0, pageSize)
    .map((project) => enrichProjectWithArtists(project, artistsLookup));

  if (normalizedQuery && projects.length === 0) {
    projects = (await readProjectsFromSupabase())
      .filter((project) =>
        projectMatchesPageFilters(project, normalizedCategories, normalizedArtists, normalizedRoles),
      )
      .filter((project) => projectMatchesSearch(project, normalizedQuery))
      .slice(0, pageSize);
  }

  const lastProject = rawProjects[rawProjects.length - 1];
  const hasMore = rawProjects.length > pageSize;

  return {
    projects,
    hasMore,
    nextCursor:
      hasMore && lastProject
        ? encodeProjectsCursor({
            createdAt: lastProject.createdAt,
            id: lastProject.id,
          })
        : null,
  };
}

export async function getProjectsPage(options = {}) {
  try {
    return await getProjectsPageInternal(options);
  } catch (error) {
    console.error("Error reading projects page from Supabase:", error);
    return { projects: [], hasMore: false, nextCursor: null, degraded: true };
  }
}

export async function getProjectBySlug(slug) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  const project = rowToProject(data);
  return enrichProjectWithArtists(project, await getArtistsLookup());
}

export async function getArtists() {
  return readArtistsFromSupabase();
}

export async function getArtistBySlug(slug) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return rowToArtist(data);
}

export async function getProjectsByArtist(artistSlug) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const projects = await readProjectsFromSupabase();
  return projects.filter((project) =>
    projectMatchesArtist(project, artistSlug),
  );
}

export async function addProject(input) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");

  const artistSlugs = normalizeArtistSlugList(input.artistSlugs);
  const searchTokens = buildProjectSearchTokens({
    title: input.title,
    description: input.description,
    categories: normalizeCategoryList(input.categories),
    subcategories: normalizeCategoryList(input.subcategories),
    artistSlugs,
    artistRoles: input.artistRoles,
  });

  const row = {
    title: input.title,
    slug: input.slug,
    categories: normalizeCategoryList(input.categories),
    subcategories: normalizeCategoryList(input.subcategories),
    artist_roles: normalizeProjectArtistRoles(input.artistRoles),
    image_url: input.imageUrl ?? null,
    image_urls: Array.isArray(input.imageUrls) ? input.imageUrls : [],
    preview_image_url: input.previewImageUrl ?? null,
    video_url: input.videoUrl ?? null,
    video_urls: Array.isArray(input.videoUrls) ? input.videoUrls : [],
    youtube_url: input.youtubeUrl ?? null,
    instagram_url: input.instagramUrl ?? null,
    media_type: input.mediaType ?? null,
    description: input.description ?? null,
    artist_slugs: artistSlugs,
    search_tokens: searchTokens,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  const project = rowToProject(data);
  return enrichProjectWithArtists(project, await getArtistsLookup());
}

export async function addArtist(input) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");

  const row = {
    name: input.name,
    slug: input.slug,
    slogan: input.slogan ?? null,
    instagram_url: input.instagramUrl ?? null,
    bio: input.bio ?? null,
    image_url: input.imageUrl ?? null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("artists")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return rowToArtist(data);
}

export async function deleteArtist(id) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const numericId = Number(id);
  const { error } = await supabase.from("artists").delete().eq("id", numericId);
  if (error) return false;
  return true;
}

export async function updateArtist(id, input) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const numericId = Number(id);

  const row = {
    name: input.name,
    slug: input.slug,
    slogan: input.slogan ?? null,
    instagram_url: input.instagramUrl ?? null,
    bio: input.bio ?? null,
    image_url: input.imageUrl ?? null,
  };

  const { data, error } = await supabase
    .from("artists")
    .update(row)
    .eq("id", numericId)
    .select()
    .single();

  if (error) throw error;
  return rowToArtist(data);
}

export async function updateProject(id, input) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const numericId = Number(id);
  const artistSlugs = normalizeArtistSlugList(input.artistSlugs);

  const row = {
    title: input.title,
    slug: input.slug,
    categories: normalizeCategoryList(input.categories),
    subcategories: normalizeCategoryList(input.subcategories),
    artist_roles: normalizeProjectArtistRoles(input.artistRoles),
    image_url: input.imageUrl ?? null,
    image_urls: Array.isArray(input.imageUrls) ? input.imageUrls : [],
    preview_image_url: input.previewImageUrl ?? null,
    video_url: input.videoUrl ?? null,
    video_urls: Array.isArray(input.videoUrls) ? input.videoUrls : [],
    youtube_url: input.youtubeUrl ?? null,
    instagram_url: input.instagramUrl ?? null,
    media_type: input.mediaType ?? null,
    description: input.description ?? null,
    artist_slugs: artistSlugs,
    search_tokens: buildProjectSearchTokens({
      title: input.title,
      description: input.description,
      categories: input.categories,
      subcategories: input.subcategories,
      artistSlugs,
      artistRoles: input.artistRoles,
    }),
  };

  const { data, error } = await supabase
    .from("projects")
    .update(row)
    .eq("id", numericId)
    .select()
    .single();

  if (error) throw error;
  const project = rowToProject(data);
  return enrichProjectWithArtists(project, await getArtistsLookup());
}

export async function deleteProject(id) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const numericId = Number(id);

  const { data: existing } = await supabase
    .from("projects")
    .select("*")
    .eq("id", numericId)
    .maybeSingle();

  const { error } = await supabase.from("projects").delete().eq("id", numericId);
  if (error || !existing) return null;

  return enrichProjectWithArtists(rowToProject(existing), await getArtistsLookup());
}

export async function getSiteSettings() {
  if (!isSupabaseReady()) return null;
  return supabaseClient.getSiteSettings();
}

export async function setSiteSettings(updates) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  return supabaseClient.setSiteSettings(updates);
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
    const logos = await supabaseClient.getClientLogos();
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

  await supabaseClient.addClientLogos(normalized);
  return supabaseClient.getClientLogos();
}

export async function deleteClientLogo(publicId) {
  if (!publicId) return false;

  try {
    await destroyByPublicId(publicId, "image");
  } catch (error) {
    console.warn("deleteClientLogo: cloudinary delete failed", error?.message);
  }

  if (isSupabaseReady()) {
    await supabase.from("clients").delete().eq("public_id", publicId);
  }

  return true;
}
