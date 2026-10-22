import * as db from "../../../../src/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const artists = await db.getArtistSummaries();
    return NextResponse.json({ artists }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
