import { NextResponse } from "next/server";
import argon2 from "argon2";
import { v4 as uuidv4 } from "uuid";
import supabaseClient, { supabase } from "../../../lib/supabase";

export async function POST(req) {
  try {
    const data = await req.json();
    const email = data?.email?.toString()?.toLowerCase();
    const otp = data?.otp?.toString();
    if (!email || !otp)
      return NextResponse.json(
        { error: "Missing email or otp" },
        { status: 400 },
      );

    const latest = await supabaseClient.getLatestOtpForEmail(email);
    if (!latest)
      return NextResponse.json({ error: "No OTP found" }, { status: 400 });
    if (latest.used)
      return NextResponse.json({ error: "OTP already used" }, { status: 400 });
    if (Date.now() > new Date(latest.expiresAt).getTime())
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });

    const match = await argon2.verify(latest.hashed || latest.otp, otp);
    if (!match)
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });

    // mark used
    if (supabase) {
      await supabase.from("otps").update({ used: true }).eq("id", latest.id);
    }

    // create session
    const sessionId = uuidv4();
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
