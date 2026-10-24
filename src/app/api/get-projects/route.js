import { NextResponse } from "next/server";
import * as db from "../../../../src/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request) {
  try {
    try {
      const { env } = await getCloudflareContext({ async: true });
      const clientIp =
        request.headers.get("CF-Connecting-IP") ||
        request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
        "unknown";
      const rateLimit = await env.PROJECTS_RATE_LIMITER?.limit({
        key: `projects:${clientIp}`,
      });

      if (rateLimit && !rateLimit.success) {
        return NextResponse.json(
          { error: "Too many project requests. Please try again shortly." },
          {
            status: 429,
            headers: {
              "Cache-Control": "no-store",
              "Retry-After": "60",
            },
          },
        );
      }
    } catch (rateLimitError) {
      // Keep local development and non-Cloudflare previews functional. The
      // production Worker has the binding and enforces the limit above.
      console.warn("Project API rate limiter unavailable:", rateLimitError?.message || rateLimitError);
    }

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
