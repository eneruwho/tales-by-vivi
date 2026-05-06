import { NextResponse } from "next/server";
import * as db from "../../../../src/lib/db";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
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
    const updated = await db.updateProject(id, {
      title,
      slug: body.slug || slugify(title),
      category: body.category || "",
      imageUrl: body.imageUrl || null,
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
      videoUrl: body.videoUrl || null,
      videoUrls: Array.isArray(body.videoUrls) ? body.videoUrls : [],
      description: body.description || null,
      artist,
      artistSlug: body.artistSlug || slugify(artist),
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
