import Link from "next/link";
import styles from "../../admin.module.css";
import { getProjects, updateProject } from "../../../actions";
import EditProjectForm from "../../../../components/EditProjectForm";

export default async function EditProjectPage({ params }) {
  const { id } = await params;
  const numId = Number(id);
  let projects = [];
  let project = null;
  try {
    projects = await getProjects();
    project = projects.find((p) => Number(p.id) === numId) || null;
  } catch (err) {
    // Log server-side for debugging and show a helpful message in UI
    console.error(
      "EditProjectPage: failed to load projects",
      err && err.message ? err.message : err,
    );
    return (
      <div style={{ padding: "3rem" }}>
        <h2>Unable to load projects</h2>
        <p>
          There was an error loading projects for editing:{" "}
          {String(err && err.message)}
        </p>
        <p>
          <Link href="/admin">Back to Admin</Link>
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: "3rem" }}>
        <h2>Project not found</h2>
        <p>The project with id {numId} could not be found.</p>
        <p>
          <Link href="/admin">Back to Admin</Link>
        </p>
      </div>
    );
  }

  const action = async (formData) => {
    "use server";
    await updateProject(numId, formData);
  };

  return (
    <div
      className={styles.container}
      style={{ maxWidth: "900px", padding: "2rem" }}
    >
      <header className={styles.header}>
        <h1>Edit Project</h1>
        <Link href="/admin">Return to Admin</Link>
      </header>

      <div style={{ marginTop: "1.5rem" }}>
        <EditProjectForm project={project} />
      </div>
    </div>
  );
}
