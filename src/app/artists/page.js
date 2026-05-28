import { getProjects, getArtists } from "../actions";
import ArtistsClient from "./ArtistsClient";

export default async function ArtistsPage() {
  const projects = await getProjects();
  let artists = await getArtists();

  if (!artists || artists.length === 0) {
    // Basic fallback if no artists exist in DB
    artists = [
      { id: 1, name: "Noisegraph", slug: "noisegraph" },
      { id: 2, name: "Ben Fearnley", slug: "ben-fearnley" },
      { id: 3, name: "Arcade Studio", slug: "arcade-studio" },
    ];
  }

  return <ArtistsClient artists={artists} projects={projects} />;
}
