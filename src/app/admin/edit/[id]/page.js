import Link from "next/link";
import styles from "../../admin.module.css";
import { getProjects, updateProject } from "../../../actions";

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
        <form action={action}>
          <div className={styles.inputGroup}>
            <label>Title</label>
            <input
              type="text"
              name="title"
              required
              defaultValue={project.title}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Slug (Optional)</label>
            <input
              type="text"
              name="slug"
              defaultValue={project.slug}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Category</label>
            <input
              type="text"
              name="category"
              required
              defaultValue={project.category}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Artist Name</label>
            <input
              type="text"
              name="artist"
              required
              defaultValue={project.artist}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Artist Slug (Optional)</label>
            <input
              type="text"
              name="artistSlug"
              defaultValue={project.artistSlug}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Image URL</label>
            <input
              type="url"
              name="imageUrl"
              defaultValue={project.imageUrl || ""}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Upload New Project Images</label>
            <input
              type="file"
              name="projectImages"
              accept="image/*"
              multiple
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Video URL (Optional)</label>
            <input
              type="url"
              name="videoUrl"
              defaultValue={project.videoUrl || ""}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Upload New Project Videos</label>
            <input
              type="file"
              name="projectVideos"
              accept="video/*"
              multiple
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Description (Optional)</label>
            <textarea
              name="description"
              className={styles.textarea}
              defaultValue={project.description || ""}
            ></textarea>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="submit" className={styles.button}>
              Save Changes
            </button>
            <Link href="/admin" className={styles.deleteButton}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
