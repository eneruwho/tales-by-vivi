import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import argon2 from "argon2";
import supabaseClient from "../../../lib/supabase";

export async function POST(req) {
  try {
    const data = await req.json();
    const email = data?.email?.toString()?.toLowerCase();
    const password = data?.password?.toString();
    if (!email)
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    if (!password)
      return NextResponse.json({ error: "Missing password" }, { status: 400 });

    const admin = await supabaseClient.getAdminByEmail(email);
    if (!admin)
      return NextResponse.json(
        { error: "Admin account not found" },
        { status: 404 },
      );

    const passwordHash = admin.passwordHash || admin.hashedPassword;
    if (!passwordHash)
      return NextResponse.json(
        { error: "Admin password not configured" },
        { status: 400 },
      );

    const passwordOk = await argon2.verify(passwordHash, password);
    if (!passwordOk)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );

    const sessionId = randomUUID();
    // Session expires after 40 minutes (30 + 10 minute extension)
    await supabaseClient.createSession({
      sessionId,
      email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
    });

    const res = NextResponse.json({ success: true });
    res.cookies.set("adminAuth", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 40,
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
