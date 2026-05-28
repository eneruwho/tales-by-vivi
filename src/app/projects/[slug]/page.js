import { getProjectBySlug } from "../../actions";
import ProjectDetailClient from "./ProjectDetailClient";
import styles from "./projectDetail.module.css";

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1>Project Not Found</h1>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      <ProjectDetailClient project={project} />
    </main>
  );
}
