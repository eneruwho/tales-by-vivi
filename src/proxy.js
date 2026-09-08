import { NextResponse } from "next/server";
import supabaseClient from "./lib/supabase";

export async function proxy(request) {
  const url = request.nextUrl.pathname;

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
  matcher: "/admin/:path*",
};
