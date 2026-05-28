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
    if (!body?.title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const title = body.title;
    const slug = body.slug || slugify(title);
    const artistSlugs = parseArtistSlugList(body.artistSlugs);
    if (artistSlugs.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one artist for this project" },
        { status: 400 },
      );
    }

    const project = await db.addProject({
      title,
      slug,
      categories: parseCommaSeparatedList(
        body.categories || body.category || "",
      ),
      subcategories: parseCommaSeparatedList(body.subcategories || ""),
      artistRoles: normalizeProjectArtistRoles(body.artistRoles || []),
      imageUrl: body.imageUrl || null,
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
      previewImageUrl: body.previewImageUrl || null,
      videoUrl: body.videoUrl || null,
      videoUrls: Array.isArray(body.videoUrls) ? body.videoUrls : [],
      youtubeUrl: body.youtubeUrl || null,
      instagramUrl: body.instagramUrl || null,
      mediaType: body.mediaType || null,
      description: body.description || null,
      artistSlugs,
    });

    try {
      revalidatePath("/");
      revalidateProjectPaths(project);
      revalidatePath("/admin");
      invalidateProjectsCache();
    } catch (e) {
      // ignore revalidation errors
    }

    return NextResponse.json({ success: true, project });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
