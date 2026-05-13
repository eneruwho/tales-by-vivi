import Link from "next/link";
import Image from "next/image";
import { getProjects } from "../actions";
import styles from "./projects.module.css";
import {
  getProjectArtistEntries,
  getProjectArtistLabel,
} from "../../lib/projectArtists";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Archive</p>
            <h1 className={styles.title}>Projects</h1>
            <p className={styles.subtitle}>
              Every project in one place, with all contributing artists shown
              underneath.
            </p>
          </div>
          <Link href="/" className={styles.backLink}>
            Back to home
          </Link>
        </header>

        {projects.length > 0 ? (
          <section className={styles.grid}>
            {projects.map((project) => {
              const imageSrc = project.previewImageUrl || project.imageUrl;
              const artistEntries = getProjectArtistEntries(project);
              const artistLabel = getProjectArtistLabel(project);

              return (
                <article key={project.id} className={styles.card}>
                  <Link
                    href={`/projects/${project.slug}`}
                    className={styles.cardLink}
                    data-cursor="hover"
                    aria-label={`Open ${project.title}`}
                  >
                    <span className={styles.srOnly}>
                      Open {project.title}
                    </span>
                  </Link>
                  <div className={styles.mediaWrap}>
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={project.title}
                        className={styles.media}
                        width={1600}
                        height={900}
                        unoptimized
                      />
                    ) : (
                      <div className={styles.placeholder}>
                        <span>No preview image</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.info}>
                    <div className={styles.metaLine}>
                      <span className={styles.index}>
                        {String(project.id).padStart(2, "0")}
                      </span>
                      {Array.isArray(project.categories) &&
                        project.categories.length > 0 && (
                          <span className={styles.categories}>
                            {project.categories.join(", ")}
                          </span>
                        )}
                    </div>

                    <h2 className={styles.cardTitle}>{project.title}</h2>

                    <div className={styles.artistRow}>
                      {artistEntries.length > 0 ? (
                        artistEntries.map((artist) => (
                          <Link
                            key={artist.slug}
                            href={`/artists/${artist.slug}`}
                            className={styles.artistLink}
                            data-cursor="hover"
                          >
                            {artist.name}
                          </Link>
                        ))
                      ) : (
                        <span className={styles.artistFallback}>
                          {artistLabel || "Unknown artists"}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className={styles.emptyState}>
            <p>No projects have been added yet.</p>
            <Link href="/admin" className={styles.adminLink}>
              Add projects in the CMS
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
