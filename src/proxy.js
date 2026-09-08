import { NextResponse } from "next/server";
import supabaseClient from "./lib/supabase";

// Set to true to enable Maintenance Mode across all public pages.
// Set to false to disable Maintenance Mode and restore full website access.
const MAINTENANCE_MODE = true;

export async function proxy(request) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
