import { NextResponse } from "next/server";
import * as cloud from "../../../../src/lib/cloudinary";
import { uploadBuffer } from "../../../../src/lib/cloudinary";
import { hasAdminRequest } from "../../../../src/lib/adminAuth";

export async function POST(req) {
  try {
    if (!(await hasAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await req.json();
    const url = data?.url;
    const folder = data?.folder || "";
    if (!url)
      return NextResponse.json({ error: "Missing url" }, { status: 400 });

    try {
      const result = await cloud.uploadFromUrl(url, folder);
      return NextResponse.json({ success: true, result });
    } catch (err) {
      // Fallback: fetch the remote file server-side and upload buffer to Cloudinary
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const filename =
          new URL(url).pathname.split("/").pop() || `upload-${Date.now()}`;
        const result = await uploadBuffer(buffer, folder, "image", filename);
        return NextResponse.json({ success: true, result, fallback: true });
      } catch (err2) {
        return NextResponse.json(
          { error: (err2 && err2.message) || err.message || "Upload failed" },
          { status: 500 },
        );
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
