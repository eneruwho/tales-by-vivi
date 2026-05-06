import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import argon2 from "argon2";
import firestore from "../../../../src/lib/firestore";

export async function POST(req) {
  try {
    const data = await req.json();
    const email = data?.email?.toString()?.toLowerCase();
    const password = data?.password?.toString();
    if (!email)
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    if (!password)
      return NextResponse.json({ error: "Missing password" }, { status: 400 });

    const admin = await firestore.getAdminByEmail(email);
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
    await firestore.createSession({
      sessionId,
      email,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    const res = NextResponse.json({ success: true });
    res.cookies.set("adminAuth", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 30,
    });
    return res;

    /*
    Mailgun OTP flow disabled for now.
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await argon2.hash(otp);
    const record = {
      email,
      hashed,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      used: false,
    };
    await firestore.addOtpRecord(record);

    const mg = new Mailgun(formData);
    const mgClient = mg.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
    });
    const domain = process.env.MAILGUN_DOMAIN;
    await mgClient.messages.create(domain, {
      from: process.env.MAILGUN_FROM || `no-reply@${domain}`,
      to: email,
      subject: "Your admin OTP",
      text: `Your one-time admin OTP is: ${otp}. It is valid for 1 minute.`,
    });

    return NextResponse.json({ success: true });
    */
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
