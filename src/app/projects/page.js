import { Suspense } from "react";
import { getProjectListing } from "../../lib/db";
import { getArtistSummaries } from "../actions";
import ProjectsClient from "./ProjectsClient";

// Rendered per request (cheap: data comes from the per-isolate cache). Prerendering
// at build time could freeze an empty archive if Supabase is unreachable then.
export const dynamic = "force-dynamic";

// Only what the archive grid and filters need. Everything is filtered, searched
// and paged in the browser, so filter clicks and "Load more" never hit the
// server, Supabase or the rate limiter.
function toListingProject(project) {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    categories: project.categories,
    artistRoles: project.artistRoles,
    artistSlugs: project.artistSlugs,
    artists: project.artists,
    imageUrl: project.imageUrl,
    previewImageUrl: project.previewImageUrl,
    createdAt: project.createdAt,
  };
}

export default async function ProjectsPage() {
  const [listing, artists] = await Promise.all([
    getProjectListing(),
    getArtistSummaries(),
  ]);

  return (
    <Suspense fallback={null}>
      <ProjectsClient
        projects={listing.projects.map(toListingProject)}
        degraded={listing.degraded}
        artists={artists.map(({ id, name, instagramUrl }) => ({
          id,
          name,
          instagramUrl,
        }))}
      />
    </Suspense>
  );
}
