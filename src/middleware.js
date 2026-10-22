import { NextResponse } from "next/server";
import supabaseClient from "./lib/supabase";

// Set to true to enable Maintenance Mode across all public pages.
// Set to false to disable Maintenance Mode and restore full website access.
const MAINTENANCE_MODE = false;

export async function middleware(request) {
  const url = request.nextUrl.pathname;

  // 1. Check Maintenance Mode for public routes
  if (MAINTENANCE_MODE) {
    const isPublicRoute =
      !url.startsWith("/admin") &&
      !url.startsWith("/login") &&
      !url.startsWith("/maintenance") &&
      !url.startsWith("/api") &&
      !url.startsWith("/_next") &&
      !url.includes("."); // Allow static files like images/css

    if (isPublicRoute) {
      return NextResponse.rewrite(new URL("/maintenance", request.url));
    }
  }

  // 2. Protect Admin routes
  if (url.startsWith("/admin")) {
    const authCookie = request.cookies.get("adminAuth");
    const sessionId = authCookie?.value;

    if (!sessionId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const session = await supabaseClient.getSessionById(sessionId);
      const expiresTime = session?.expiresAt ? new Date(session.expiresAt).getTime() : null;
      if (!session || (expiresTime && Date.now() > expiresTime)) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Middleware is only needed for the admin session gate. Matching every
  // public page and asset forces Netlify to invoke its edge layer for normal
  // portfolio traffic and makes crawler spikes much more expensive.
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/add-project",
    "/api/add-artist",
    "/api/update-project",
    "/api/update-artist",
    "/api/cloudinary-upload",
    "/api/cloudinary-upload-file",
  ],
};
