import { getArtistForSlug, getProjectsForArtistSlug } from "./data";
import ArtistProfileClient from "./ArtistProfileClient";
import styles from "./artistDetail.module.css";

const fallbackDescription =
  "Artist profile and featured projects from Tales by VIVI, a Kolkata-based creative studio for animation, motion design, and visual storytelling.";

function cleanDescription(value, fallback = fallbackDescription) {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > 160
    ? `${normalized.slice(0, 157).trim()}...`
    : normalized;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const artist = await getArtistForSlug(slug);

  if (!artist) {
    return {
      title: "Artist Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = artist.name || "Artist";
  const description = cleanDescription(artist.bio || artist.slogan);
  const image = artist.imageUrl || artist.previewImageUrl || "/logo.png";
  const url = `/artists/${artist.slug || slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Tales by VIVI",
      images: [
        {
          url: image,
          alt: title,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ArtistDetailPage({ params }) {
  const { slug } = await params;
  const artist = await getArtistForSlug(slug);
  const projects = await getProjectsForArtistSlug(slug);

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
