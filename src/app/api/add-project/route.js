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
    if (!body?.title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const title = body.title;
    const slug = body.slug || slugify(title);
    const artist = body.artist || "";
    const artistSlug = body.artistSlug || slugify(artist);

    const project = await db.addProject({
      title,
      slug,
      category: body.category || "",
      imageUrl: body.imageUrl || null,
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
      videoUrl: body.videoUrl || null,
      videoUrls: Array.isArray(body.videoUrls) ? body.videoUrls : [],
      description: body.description || null,
      artist,
      artistSlug,
    });

    return NextResponse.json({ success: true, project });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
