import { getProjectSummaries, getArtistSummaries } from "../actions";
import ArtistsClient from "./ArtistsClient";

export const revalidate = 300;

export default async function ArtistsPage() {
  const projects = await getProjectSummaries();
  let artists = await getArtistSummaries();

  return <ArtistsClient artists={artists} projects={projects} />;
}
