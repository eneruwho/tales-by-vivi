"use server";

import * as db from "../lib/db";
import { revalidatePath } from "next/cache";
import { uploadBuffer } from "../lib/cloudinary";

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
        url: result.secure_url,
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

  const category = formData.get("category");
  if (!category?.trim()) {
    throw new Error("Project category is required");
  }

  const artist = formData.get("artist");
  if (!artist?.trim()) {
    throw new Error("Please select an artist for this project");
  }

  const slug = formData.get("slug") || slugify(title);
  const artistSlug = formData.get("artistSlug") || slugify(artist);
  const uploadedImages = await uploadFiles(
    formData.getAll("projectImages"),
    "project",
  );
  const uploadedVideos = await uploadFiles(
    formData.getAll("projectVideos"),
    "project",
  );
  const imageUrl = formData.get("imageUrl") || uploadedImages[0]?.url || null;
  const videoUrl = formData.get("videoUrl") || uploadedVideos[0]?.url || null;

  await db.addProject({
    title,
    slug,
    category,
    imageUrl,
    imageUrls: uploadedImages.map((item) => item.url).filter(Boolean),
    videoUrl,
    videoUrls: uploadedVideos.map((item) => item.url).filter(Boolean),
    description: formData.get("description") || null,
    artist,
    artistSlug,
  });

  revalidatePath("/admin");
  revalidatePath("/");
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

  await db.addArtist({
    name,
    slug,
    slogan: formData.get("slogan") || null,
    bio: formData.get("bio") || null,
    imageUrl: formData.get("imageUrl") || uploadedImages[0]?.url || null,
  });

  revalidatePath("/admin");
  revalidatePath("/artists");
}

export async function updateShowreel(formData) {
  const showreelUrl = formData.get("showreelUrl");
  const uploaded = await uploadFiles(
    formData.getAll("showreelVideo"),
    "showreel",
  );

  const trimmedShowreelUrl = hasNonEmptyString(showreelUrl)
    ? showreelUrl.trim()
    : null;
  const resolvedShowreelUrl = trimmedShowreelUrl || uploaded[0]?.url || null;

  if (!resolvedShowreelUrl) {
    throw new Error("Please provide a showreel URL or upload a video");
  }

  await db.setSiteSettings({ showreelUrl: resolvedShowreelUrl });
  revalidatePath("/");
  revalidatePath("/admin");
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
}

export async function removeClientLogo(publicId) {
  await db.deleteClientLogo(publicId);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteArtist(id) {
  await db.deleteArtist(id);

  revalidatePath("/admin");
  revalidatePath("/artists");
}

export async function updateProject(id, formData) {
  const title = formData.get("title");
  const slug = formData.get("slug") || slugify(title);
  const artist = formData.get("artist");
  const artistSlug = formData.get("artistSlug") || slugify(artist);
  const uploadedImages = await uploadFiles(
    formData.getAll("projectImages"),
    "project",
  );
  const uploadedVideos = await uploadFiles(
    formData.getAll("projectVideos"),
    "project",
  );
  const imageUrl = formData.get("imageUrl") || uploadedImages[0]?.url || null;
  const videoUrl = formData.get("videoUrl") || uploadedVideos[0]?.url || null;

  await db.updateProject(id, {
    id,
    title,
    slug,
    category: formData.get("category"),
    imageUrl,
    imageUrls: uploadedImages.map((item) => item.url).filter(Boolean),
    videoUrl,
    videoUrls: uploadedVideos.map((item) => item.url).filter(Boolean),
    description: formData.get("description") || null,
    artist,
    artistSlug,
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteProject(id) {
  await db.deleteProject(id);

  revalidatePath("/admin");
  revalidatePath("/");
}
