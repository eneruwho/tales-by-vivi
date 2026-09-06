import { getProjectsPage } from "../../lib/db";
import ProjectsClient from "./ProjectsClient";

export default async function ProjectsPage({ searchParams }) {
  const params = await searchParams;
  const category = Array.isArray(params?.category)
    ? params.category
    : params?.category
      ? [params.category]
      : [];
  const artist = Array.isArray(params?.artist)
    ? params.artist
    : params?.artist
      ? [params.artist]
      : [];
  const role = Array.isArray(params?.role)
    ? params.role
    : params?.role
      ? [params.role]
      : [];
  const result = await getProjectsPage({
    category,
    artist,
    role,
    query: params?.q || "",
  });

  return (
    <ProjectsClient
      projects={result.projects}
      initialCursor={result.nextCursor}
      initialHasMore={result.hasMore}
    />
  );
}
