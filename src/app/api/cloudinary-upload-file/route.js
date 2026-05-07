import { NextResponse } from "next/server";
import { uploadBuffer } from "../../../../src/lib/cloudinary";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "showreels";

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = file.name || `upload-${Date.now()}`;
      const result = await uploadBuffer(buffer, folder, "video", filename);
      return NextResponse.json({ success: true, result });
    } catch (err) {
      return NextResponse.json(
        { error: err?.message || "Upload failed" },
        { status: 500 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}
