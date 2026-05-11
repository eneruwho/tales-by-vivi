import { NextResponse } from "next/server";
import firestore from "../../../../src/lib/firestore";

export async function GET(req) {
  try {
    const authCookie = req.cookies.get("adminAuth");
    const sessionId = authCookie?.value;
    if (!sessionId) return NextResponse.json({ ok: false }, { status: 200 });
    const session = await firestore.getSessionById(sessionId);
    if (!session) return NextResponse.json({ ok: false }, { status: 200 });
    if (session.expiresAt && Date.now() > session.expiresAt) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }
    return NextResponse.json(
      { ok: true, expiresAt: session.expiresAt },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
