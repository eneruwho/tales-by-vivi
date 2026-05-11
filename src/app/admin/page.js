import { getProjects, getArtists, getClientLogos } from "../actions";
import styles from "./admin.module.css";
import Link from "next/link";
import AdminPanel from "../../components/AdminPanel";

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
      <div className={styles.dashboardIntro}>
        <h2>Dashboard</h2>
        <p className={styles.dashboardSub}>Quick overview and actions</p>
      </div>

      <div className={styles.dashboardStats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Projects</div>
          <div className={styles.statValue}>{projects.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Artists</div>
          <div className={styles.statValue}>{artists.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Client Logos</div>
          <div className={styles.statValue}>{clientLogos?.length || 0}</div>
        </div>
      </div>

      <AdminPanel
        projects={projects}
        artists={artists}
        clientLogos={clientLogos}
      />
    </div>
  );
}
