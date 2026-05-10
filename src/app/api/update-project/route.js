import { NextResponse } from "next/server";
import * as db from "../../../../src/lib/db";
import { revalidatePath } from "next/cache";

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

export async function POST(req) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const title = body.title || "";
    const artist = body.artist || "";
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
      subcategories: parseCommaSeparatedList(body.subcategories || ""),
      artistRoles: parseCommaSeparatedList(body.artistRoles || ""),
      imageUrl: body.imageUrl || null,
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
      videoUrl: body.videoUrl || null,
      videoUrls: Array.isArray(body.videoUrls) ? body.videoUrls : [],
      description: body.description || null,
      artist,
      artistSlug: body.artistSlug || slugify(artist),
    });
    try {
      revalidatePath("/");
      revalidatePath("/projects");
      revalidatePath(`/projects/${updated.slug}`);
      revalidatePath("/admin");
      // if project changed artist, revalidate both old and new artist pages
      const newArtistSlug = updated.artistSlug;
      const oldArtistSlug = prevProject?.artistSlug || null;
      if (oldArtistSlug && oldArtistSlug !== newArtistSlug) {
        revalidatePath(`/artists/${oldArtistSlug}`);
      }
      if (newArtistSlug) revalidatePath(`/artists/${newArtistSlug}`);
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
