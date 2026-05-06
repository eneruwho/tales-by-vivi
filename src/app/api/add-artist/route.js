import { NextResponse } from "next/server";
import * as db from "../../../../src/lib/db";

export async function POST(req) {
  try {
    const data = await req.json();
    if (!data?.name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }

    const slug = (data.slug || data.name)
      .toString()
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");

    const artist = await db.addArtist({
      name: data.name,
      slug,
      slogan: data.slogan || null,
      bio: data.bio || null,
      imageUrl: data.imageUrl || null,
    });
    return NextResponse.json({ success: true, artist });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
