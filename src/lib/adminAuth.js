import { cookies } from "next/headers";
import supabaseClient from "./supabase.js";

export async function getAdminSession(sessionId) {
  if (!sessionId) return null;
  const session = await supabaseClient.getSessionById(sessionId);
  if (!session) return null;
  if (session.expiresAt && Date.now() > new Date(session.expiresAt).getTime()) {
    return null;
  }
  return session;
}

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const session = await getAdminSession(cookieStore.get("adminAuth")?.value);
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function hasAdminRequest(req) {
  try {
    return Boolean(await getAdminSession(req.cookies.get("adminAuth")?.value));
  } catch {
    return false;
  }
}
