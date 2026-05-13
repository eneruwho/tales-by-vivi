import { getProjects } from "../actions";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }) {
  await searchParams;
  const projects = await getProjects();

  return <ProjectsClient projects={projects} />;
}
