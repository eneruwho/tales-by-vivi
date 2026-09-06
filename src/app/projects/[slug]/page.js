import { getProjectForSlug } from "./data";
import ProjectDetailClient from "./ProjectDetailClient";
import styles from "./projectDetail.module.css";

const fallbackDescription =
  "A featured project from Tales by VIVI, a Kolkata-based creative studio for animation, motion design, and visual storytelling.";

function cleanDescription(value) {
  if (typeof value !== "string") return fallbackDescription;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return fallbackDescription;
  return normalized.length > 160
    ? `${normalized.slice(0, 157).trim()}...`
    : normalized;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = await getProjectForSlug(slug);

  if (!project) {
    return {
      title: "Project Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = project.title || "Project";
  const description = cleanDescription(project.description);
  const image = project.previewImageUrl || project.imageUrl || "/logo.png";
  const url = `/projects/${project.slug || slug}`;

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
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;
  const project = await getProjectForSlug(slug);

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
