import { NextResponse } from "next/server";
import * as db from "../../../../src/lib/db";

export async function GET(request) {
  try {
    const requestUrl = new URL(request.url);
    const params = requestUrl.searchParams;
    const result = await db.getProjectsPage({
      limit: params.get("limit") || 12,
      cursor: params.get("cursor") || "",
      category: params.getAll("category"),
      artist: params.getAll("artist"),
      role: params.getAll("role"),
      query: params.get("q") || "",
    });
    return NextResponse.json({ ...result, projects: result.projects }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
