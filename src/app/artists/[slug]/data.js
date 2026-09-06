import { cache } from "react";
import { getArtistBySlug, getProjectsByArtist } from "../../actions";

export const getArtistForSlug = cache(async (slug) => getArtistBySlug(slug));

export const getProjectsForArtistSlug = cache(async (slug) =>
  getProjectsByArtist(slug),
);
