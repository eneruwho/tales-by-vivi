"use server";

import * as db from "../lib/db";
import { revalidatePath } from "next/cache";
import { uploadBuffer } from "../lib/cloudinary";
import { normalizeProjectArtistRoles } from "../lib/projectArtists";
import { normalizeCategoryList } from "../lib/categories";
import {
  invalidateArtistsCache,
  invalidateClientLogosCache,
  invalidateProjectsCache,
  invalidateSiteSettingsCache,
} from "../lib/cache";

export async function getProjects() {
  return db.getProjects();
}

export async function getProjectBySlug(slug) {
  return db.getProjectBySlug(slug);
}

export async function getArtists() {
  return db.getArtists();
}

export async function getArtistBySlug(slug) {
  return db.getArtistBySlug(slug);
}

export async function getProjectsByArtist(artistSlug) {
  return db.getProjectsByArtist(artistSlug);
}

export async function getSiteSettings() {
  return db.getSiteSettings();
}

export async function getClientLogos() {
  return db.getClientLogos();
}

export async function deleteClientLogo(publicId) {
  return db.deleteClientLogo(publicId);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
}

function isUploadableFile(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.arrayBuffer === "function" &&
    value.size > 0
  );
}

function hasNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseCommaSeparatedList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseArtistSlugList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const slug = value.trim();
    return slug ? [slug] : [];
  }

  return [];
}

function revalidateProjectArtistPaths(project) {
  const artistSlugs = Array.isArray(project?.artistSlugs)
    ? project.artistSlugs
    : [];

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/artists");
  if (project?.slug) {
    revalidatePath(`/projects/${project.slug}`);
  }
  artistSlugs.forEach((slug) => {
    if (slug) revalidatePath(`/artists/${slug}`);
  });
}

async function uploadFiles(values, folder) {
  const files = values.filter(isUploadableFile);
  if (files.length === 0) return [];

  const uploads = await Promise.all(
    files.map(async (file, index) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.length === 0) {
        throw new Error(`File "${file.name}" is empty`);
      }
      const uniqueName = `${folder}-${Date.now()}-${index + 1}`;
      const result = await uploadBuffer(
        buffer,
        folder,
        file.type?.startsWith("video/") ? "video" : "auto",
        uniqueName,
      );
      return {
        // Prefer secure_url, fall back to url if present
        url: result.secure_url || result.url || null,
        publicId: result.public_id,
        resourceType: result.resource_type,
      };
    }),
  );

  return uploads;
}

export async function addProject(formData) {
  const title = formData.get("title");
  if (!title?.trim()) {
    throw new Error("Project title is required");
  }

  const rawCategories = formData.get("categories") || "";
  const categories = normalizeCategoryList(rawCategories);
  if (categories.length === 0) {
    throw new Error("At least one category is required");
  }

  const artistRoles = normalizeProjectArtistRoles(
    formData.get("artistRoles") || [],
  );

  const artistSlugs = parseArtistSlugList(formData.getAll("artistSlugs"));
  if (artistSlugs.length === 0) {
    throw new Error("Please select at least one artist for this project");
  }

  const slug = formData.get("slug") || slugify(title);

  // Upload project images
  const uploadedImages = await uploadFiles(
    formData.getAll("projectImages"),
    "project",
  );
  const uploadedVideos = await uploadFiles(
    formData.getAll("projectVideos"),
    "project",
  );

  // Upload preview image (required)
  const uploadedPreview = await uploadFiles(
    formData.getAll("previewImage"),
    "project_preview",
  );

  const previewImageUrl =
    uploadedPreview[0]?.url || formData.get("previewImageUrl") || null;

  const youtubeUrl = formData.get("youtubeUrl") || null;
  const instagramUrl = formData.get("instagramUrl") || null;
  const mediaType = formData.get("mediaType") || null;

  const imageUrl = formData.get("imageUrl") || uploadedImages[0]?.url || null;
  const videoUrl = uploadedVideos[0]?.url || null;

  // Server-side validations
  if (!previewImageUrl) {
    throw new Error("Preview image is required");
  }

  if (mediaType === "youtube" && !youtubeUrl) {
    throw new Error("YouTube URL is required for YouTube media type");
  }
  if (mediaType === "instagram" && !instagramUrl) {
    throw new Error("Instagram URL is required for Instagram media type");
  }

  // Require at least one media source for the project itself (image or embed URL)
  if (!imageUrl && !youtubeUrl && !instagramUrl) {
    throw new Error(
      "Please provide a project image URL or a YouTube or Instagram URL",
    );
  }

  const created = await db.addProject({
    title,
    slug,
    categories,
    artistRoles,
    imageUrl,
    imageUrls: uploadedImages.map((item) => item.url).filter(Boolean),
    videoUrl,
    videoUrls: uploadedVideos.map((item) => item.url).filter(Boolean),
    youtubeUrl,
    instagramUrl,
    mediaType,
    previewImageUrl,
    description: formData.get("description") || null,
    artistSlugs,
  });
  revalidatePath("/admin");
  revalidateProjectArtistPaths(created);
  invalidateProjectsCache();

  return created;
}

export async function addArtist(formData) {
  const name = formData.get("name");
  if (!name?.trim()) {
    throw new Error("Artist name is required");
  }

  const slug = formData.get("slug") || slugify(name);
  const uploadedImages = await uploadFiles(
    formData.getAll("artistImage"),
    "artists",
  );
  const created = await db.addArtist({
    name,
    slug,
    slogan: formData.get("slogan") || null,
    instagramUrl: formData.get("instagramUrl") || null,
    bio: formData.get("bio") || null,
    imageUrl: formData.get("imageUrl") || uploadedImages[0]?.url || null,
  });

  revalidatePath("/admin");
  revalidatePath("/artists");
  invalidateArtistsCache();

  return created;
}

export async function updateShowreel(formData) {
  const showreelUrl = formData.get("showreelUrl");
  const resolvedShowreelUrl = hasNonEmptyString(showreelUrl)
    ? showreelUrl.trim()
    : null;

  if (!resolvedShowreelUrl) {
    throw new Error("Please provide a showreel URL");
  }

  await db.setSiteSettings({
    showreelUrl: resolvedShowreelUrl,
  });
  revalidatePath("/");
  revalidatePath("/admin");
  invalidateSiteSettingsCache();
}

export async function addClientLogos(formData) {
  const uploaded = await uploadFiles(
    formData.getAll("clientLogos"),
    "client_images",
  );

  if (uploaded.length === 0) {
    throw new Error("Please upload at least one client logo");
  }

  await db.addClientLogos(uploaded);
  revalidatePath("/");
  revalidatePath("/admin");
  invalidateClientLogosCache();
}

export async function removeClientLogo(publicId) {
  await db.deleteClientLogo(publicId);
  revalidatePath("/");
  revalidatePath("/admin");
  invalidateClientLogosCache();
}

export async function deleteArtist(id) {
  await db.deleteArtist(id);

  revalidatePath("/admin");
  revalidatePath("/artists");
  invalidateArtistsCache();
}

export async function updateProject(id, formData) {
  const title = formData.get("title");
  const slug = formData.get("slug") || slugify(title);
  const artistSlugs = parseArtistSlugList(formData.getAll("artistSlugs"));
  if (artistSlugs.length === 0) {
    throw new Error("Please select at least one artist for this project");
  }

  const rawCategories = formData.get("categories") || "";
  const categories = normalizeCategoryList(rawCategories);
  const subcategories = normalizeCategoryList(
    formData.get("subcategories") || "",
  );
  const artistRoles = normalizeProjectArtistRoles(
    formData.get("artistRoles") || [],
  );

  const uploadedImages = await uploadFiles(
    formData.getAll("projectImages"),
    "project",
  );
  const uploadedPreviewImages = await uploadFiles(
    formData.getAll("previewImage"),
    "project_preview",
  );
  const uploadedVideos = await uploadFiles(
    formData.getAll("projectVideos"),
    "project",
  );

  const imageUrl = formData.get("imageUrl") || uploadedImages[0]?.url || null;
  const previewImageUrl =
    uploadedPreviewImages[0]?.url || formData.get("previewImageUrl") || null;
  const videoUrl = formData.get("videoUrl") || uploadedVideos[0]?.url || null;
  const youtubeUrl = formData.get("youtubeUrl") || null;
  const instagramUrl = formData.get("instagramUrl") || null;
  const mediaType = formData.get("mediaType") || null;

  // preview image is required
  if (!previewImageUrl) {
    throw new Error("Preview image is required");
  }

  // Require at least one media source for the project itself (image or embed URL)
  if (!imageUrl && !youtubeUrl && !instagramUrl) {
    throw new Error(
      "Please provide a project image URL or a YouTube or Instagram URL",
    );
  }

  await db.updateProject(id, {
    id,
    title,
    slug,
    categories,
    subcategories,
    artistRoles,
    imageUrl,
    imageUrls: uploadedImages.map((item) => item.url).filter(Boolean),
    previewImageUrl,
    videoUrl,
    videoUrls: uploadedVideos.map((item) => item.url).filter(Boolean),
    youtubeUrl,
    instagramUrl,
    mediaType,
    description: formData.get("description") || null,
    artistSlugs,
  });

  revalidatePath("/admin");
  revalidateProjectArtistPaths({ slug, artistSlugs });
  invalidateProjectsCache();
}

export async function deleteProject(id) {
  const deleted = await db.deleteProject(id);

  revalidatePath("/admin");
  if (deleted) {
    revalidateProjectArtistPaths(deleted);
  } else {
    revalidatePath("/projects");
    revalidatePath("/artists");
    revalidatePath("/");
  }
  invalidateProjectsCache();
}
