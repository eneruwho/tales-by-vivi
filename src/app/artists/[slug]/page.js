import { getArtistBySlug, getProjectsByArtist } from "../../actions";
import ArtistProfileClient from "./ArtistProfileClient";
import styles from "./artistDetail.module.css";

export default async function ArtistDetailPage({ params }) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  const projects = await getProjectsByArtist(slug);

  if (!artist) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1>Artist not found</h1>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      <ArtistProfileClient artist={artist} projects={projects} />
    </main>
  );
}
