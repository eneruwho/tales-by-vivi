import { NextResponse } from "next/server";
import * as db from "../../../../src/lib/db";
import { revalidatePath } from "next/cache";
import { normalizeProjectArtistRoles } from "../../../../src/lib/projectArtists";
import { invalidateProjectsCache } from "../../../../src/lib/cache";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
}

function parseCommaSeparatedList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseArtistSlugList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const slug = value.trim();
    return slug ? [slug] : [];
  }

  return [];
}

function revalidateProjectPaths(project) {
  revalidatePath("/projects");
  revalidatePath("/artists");
  if (project?.slug) {
    revalidatePath(`/projects/${project.slug}`);
  }
  (Array.isArray(project?.artistSlugs) ? project.artistSlugs : []).forEach(
    (slug) => {
      if (slug) revalidatePath(`/artists/${slug}`);
    },
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const title = body.title || "";
    const artistSlugs = parseArtistSlugList(body.artistSlugs);
    if (artistSlugs.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one artist for this project" },
        { status: 400 },
      );
    }
    // find previous project to detect artist change
    let prevProject = null;
    try {
      const allProjects = await db.getProjects();
      prevProject =
        allProjects.find((p) => Number(p.id) === Number(id)) || null;
    } catch (e) {
      prevProject = null;
    }

    const updated = await db.updateProject(id, {
      title,
      slug: body.slug || slugify(title),
      categories: parseCommaSeparatedList(
        body.categories || body.category || "",
      ),
      artistRoles: normalizeProjectArtistRoles(body.artistRoles || []),
      imageUrl: body.imageUrl || null,
      previewImageUrl: body.previewImageUrl || null,
      imageUrls: Array.isArray(body.imageUrls)
        ? body.imageUrls
        : parseCommaSeparatedList(body.imageUrls || ""),
      youtubeUrl: body.youtubeUrl || null,
      instagramUrl: body.instagramUrl || null,
      mediaType: body.mediaType || null,
      videoUrls: Array.isArray(body.videoUrls)
        ? body.videoUrls
        : parseCommaSeparatedList(body.videoUrls || ""),
      description: body.description || null,
      artistSlugs,
    });
    try {
      revalidatePath("/");
      revalidateProjectPaths(updated);
      revalidatePath("/admin");
      if (prevProject?.slug && prevProject.slug !== updated.slug) {
        revalidatePath(`/projects/${prevProject.slug}`);
      }
      const oldArtistSlugs = Array.isArray(prevProject?.artistSlugs)
        ? prevProject.artistSlugs
        : [];
      oldArtistSlugs.forEach((slug) => {
        if (slug && !updated.artistSlugs.includes(slug)) {
          revalidatePath(`/artists/${slug}`);
        }
      });
      invalidateProjectsCache();
    } catch (e) {
      // ignore revalidation errors
    }

    return NextResponse.json({ success: true, project: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
