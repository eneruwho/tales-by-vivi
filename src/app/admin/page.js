import {
  getProjects,
  getArtists,
  getClientLogos,
  addProject,
  deleteProject,
  addArtist,
  deleteArtist,
  updateShowreel,
  addClientLogos,
  removeClientLogo,
} from "../actions";
import styles from "./admin.module.css";
import Link from "next/link";
import ArtistEditInline from "../../components/ArtistEditInline";
import ArtistSelect from "../../components/ArtistSelect";

export default async function AdminPage() {
  const [projects, artists, clientLogos] = await Promise.all([
    getProjects(),
    getArtists(),
    getClientLogos(),
  ]);

  const removableClientLogos = clientLogos.filter(
    (logo) => logo.source === "cloudinary" && logo.publicId,
  );

  return (
    <div className={styles.container} style={{ maxWidth: "1600px" }}>
      <header className={styles.header}>
        <h1>TALES BY VIVI CMS</h1>
        <Link href="/">Return to Site</Link>
      </header>

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))" }}
      >
        <div className={styles.formPanel}>
          <h2>Showreel</h2>
          <form action={updateShowreel}>
            <div className={styles.inputGroup}>
              <label>Showreel URL</label>
              <input
                type="url"
                name="showreelUrl"
                placeholder="https://..."
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Upload Showreel Video</label>
              <input
                type="file"
                name="showreelVideo"
                accept="video/*"
                className={styles.input}
              />
            </div>
            <button type="submit" className={styles.button}>
              Save Showreel
            </button>
          </form>
        </div>

        <div className={styles.formPanel}>
          <h2>Client Logos</h2>
          <form action={addClientLogos}>
            <div className={styles.inputGroup}>
              <label>Upload Client Logos</label>
              <input
                type="file"
                name="clientLogos"
                accept="image/*"
                multiple
                className={styles.input}
              />
            </div>
            <button type="submit" className={styles.button}>
              Add Client Logos
            </button>
          </form>

          <div style={{ marginTop: "1.5rem" }}>
            <h3>Uploaded Client Logos ({removableClientLogos.length})</h3>
            <div className={styles.artistList} style={{ marginTop: "1rem" }}>
              {removableClientLogos.map((logo) => (
                <div key={logo.publicId} className={styles.artistCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <img
                      src={logo.url}
                      alt="client logo"
                      style={{ width: 72, height: 32, objectFit: "contain" }}
                    />
                    <div>
                      <div className={styles.artistName}>Client logo</div>
                      <div className={styles.artistSlug}>{logo.publicId}</div>
                    </div>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await removeClientLogo(logo.publicId);
                    }}
                  >
                    <button type="submit" className={styles.deleteButton}>
                      Delete
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Form */}
        <div className={styles.formPanel}>
          <h2>Add New Project</h2>
          <form action={addProject}>
            <div className={styles.inputGroup}>
              <label>Title</label>
              <input
                type="text"
                name="title"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Slug (Optional - auto-generated)</label>
              <input
                type="text"
                name="slug"
                className={styles.input}
                placeholder="my-awesome-project"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Category</label>
              <input
                type="text"
                name="category"
                required
                placeholder="e.g. Set Design"
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Artist</label>
              <ArtistSelect artists={artists} />
            </div>

            <div className={styles.inputGroup}>
              <label>Image URL</label>
              <input
                type="url"
                name="imageUrl"
                placeholder="https://..."
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Project Images Upload</label>
              <input
                type="file"
                name="projectImages"
                accept="image/*"
                multiple
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Video URL (Optional link)</label>
              <input
                type="url"
                name="videoUrl"
                placeholder="https://..."
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Project Videos Upload</label>
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
              ></textarea>
            </div>

            <button type="submit" className={styles.button}>
              Add Project
            </button>
          </form>
        </div>

        {/* Artist Form */}
        <div className={styles.formPanel}>
          <h2>Add New Artist</h2>
          <form action={addArtist}>
            <div className={styles.inputGroup}>
              <label>Artist Name</label>
              <input
                type="text"
                name="name"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Artist Slogan</label>
              <input
                type="text"
                name="slogan"
                placeholder="Simply Better Than Reality"
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Biography</label>
              <textarea
                name="bio"
                className={styles.textarea}
                placeholder="Madrid-Based CGI Studio..."
              ></textarea>
            </div>

            <div className={styles.inputGroup}>
              <label>Artist Profile Image URL</label>
              <input
                type="url"
                name="imageUrl"
                placeholder="https://..."
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Artist Profile Image Upload</label>
              <input
                type="file"
                name="artistImage"
                accept="image/*"
                className={styles.input}
              />
            </div>

            <button type="submit" className={styles.button}>
              Add Artist
            </button>
          </form>

          <div style={{ marginTop: "2rem" }}>
            <h3>Artists List ({artists.length})</h3>
            <div
              className={styles.artistList}
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                marginTop: "1rem",
              }}
            >
              {artists.map((a) => (
                <div key={a.id} className={styles.artistCard}>
                  <div>
                    <div className={styles.artistName}>{a.name}</div>
                    <div className={styles.artistSlug}>{a.slug}</div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <form
                      action={async () => {
                        "use server";
                        await deleteArtist(a.id);
                      }}
                    >
                      <button type="submit" className={styles.deleteButton}>
                        Delete
                      </button>
                    </form>
                    <ArtistEditInline artist={a} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className={styles.listPanel}>
          <h2>Current Projects ({projects.length})</h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {projects.map((project) => (
              <div key={project.id} className={styles.projectCard}>
                <div className={styles.projectInfo}>
                  <h3 style={{ fontSize: "1rem" }}>{project.title}</h3>
                  <p>
                    {project.category} | {project.artist}
                  </p>
                  {project.videoUrl && (
                    <span style={{ fontSize: "0.7rem", color: "#0f0" }}>
                      ● Video Included
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <form
                    action={async () => {
                      "use server";
                      await deleteProject(project.id);
                    }}
                  >
                    <button type="submit" className={styles.deleteButton}>
                      Delete
                    </button>
                  </form>
                  <a
                    href={`/admin/edit/${project.id}`}
                    className={styles.editButton}
                  >
                    Edit
                  </a>
                </div>
              </div>
            ))}
          </div>
          {projects.length === 0 && (
            <p style={{ color: "#888" }}>No projects have been added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
