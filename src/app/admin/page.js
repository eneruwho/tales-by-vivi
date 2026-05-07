import { getProjects, getArtists, getClientLogos } from "../actions";
import styles from "./admin.module.css";
import Link from "next/link";
import ProjectForm from "../../components/ProjectForm";
import ShowreelForm from "../../components/ShowreelForm";
import ClientLogosForm from "../../components/ClientLogosForm";
import ArtistForm from "../../components/ArtistForm";
import ProjectsList from "../../components/ProjectsList";

export default async function AdminPage() {
  const [projects, artists, clientLogos] = await Promise.all([
    getProjects(),
    getArtists(),
    getClientLogos(),
  ]);

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
        <ShowreelForm />

        <ClientLogosForm initialLogos={clientLogos} />

        <ProjectForm artists={artists} />

        <ArtistForm initialArtists={artists} />

        <ProjectsList initialProjects={projects} />
      </div>
    </div>
  );
}
