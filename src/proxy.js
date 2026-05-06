import { NextResponse } from "next/server";
import firestore from "./lib/firestore";

export async function proxy(request) {
  const url = request.nextUrl.pathname;

  if (url.startsWith("/admin")) {
    const authCookie = request.cookies.get("adminAuth");
    const sessionId = authCookie?.value;

    if (!sessionId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const session = await firestore.getSessionById(sessionId);
      if (!session || (session.expiresAt && Date.now() > session.expiresAt)) {
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
