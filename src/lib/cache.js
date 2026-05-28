import { revalidateTag } from "next/cache";

export const PROJECTS_TAG = "projects";
export const ARTISTS_TAG = "artists";
export const SITE_SETTINGS_TAG = "site-settings";
export const CLIENT_LOGOS_TAG = "client-logos";

export function invalidateProjectsCache() {
  revalidateTag(PROJECTS_TAG, "max");
  revalidateTag(ARTISTS_TAG, "max");
}

export function invalidateArtistsCache() {
  revalidateTag(ARTISTS_TAG, "max");
  revalidateTag(PROJECTS_TAG, "max");
}

export function invalidateSiteSettingsCache() {
  revalidateTag(SITE_SETTINGS_TAG, "max");
}

export function invalidateClientLogosCache() {
  revalidateTag(CLIENT_LOGOS_TAG, "max");
}
