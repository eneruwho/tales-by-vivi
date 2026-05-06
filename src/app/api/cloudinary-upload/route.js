import { NextResponse } from "next/server";
import * as cloud from "../../../../src/lib/cloudinary";

export async function POST(req) {
  try {
    const data = await req.json();
    const url = data?.url;
    const folder = data?.folder || "";
    if (!url)
      return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const result = await cloud.uploadFromUrl(url, folder);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
