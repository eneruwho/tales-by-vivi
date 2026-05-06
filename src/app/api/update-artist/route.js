import * as db from "../../../../src/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updated = await db.updateArtist(id, {
      name: body.name,
      slug: body.slug,
      slogan: body.slogan,
      bio: body.bio,
      imageUrl: body.imageUrl || null,
    });

    return NextResponse.json({ success: true, artist: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
