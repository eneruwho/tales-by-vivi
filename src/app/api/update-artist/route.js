import * as db from "../../../../src/lib/db";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { invalidateArtistsCache } from "../../../../src/lib/cache";

export async function POST(req) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    try {
      console.log("update-artist: incoming imageUrl=", body.imageUrl);
    } catch (e) {}

    const updated = await db.updateArtist(id, {
      name: body.name,
      slug: body.slug,
      slogan: body.slogan,
      instagramUrl: body.instagramUrl || null,
      bio: body.bio,
      imageUrl: body.imageUrl || null,
    });
    // Revalidate relevant pages so the public artists list updates immediately
    try {
      revalidatePath("/artists");
      revalidatePath("/projects");
      revalidatePath("/");
      invalidateArtistsCache();
    } catch (e) {
      // ignore; revalidation isn't critical if it fails
    }

    return NextResponse.json({ success: true, artist: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
