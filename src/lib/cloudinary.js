import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadFromUrl(url, folder = "") {
  const opts = { resource_type: "auto" };
  if (folder) opts.folder = folder;
  return cloudinary.uploader.upload(url, opts);
}

export async function listFolderResources(folder, resourceType = "image") {
  const prefix = folder ? `${folder}/` : "";
  return cloudinary.api.resources({
    resource_type: resourceType,
    type: "upload",
    prefix,
    max_results: 100,
  });
}

export async function destroyByPublicId(publicId, resourceType = "image") {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
}

export async function uploadBuffer(
  buffer,
  folder = "",
  resourceType = "auto",
  filename = "upload",
) {
  const opts = {
    resource_type: resourceType,
    public_id: filename.replace(/\.[^/.]+$/, ""),
  };
  if (folder) opts.folder = folder;

  return new Promise((resolve, reject) => {
    const uploader =
      resourceType === "video"
        ? cloudinary.uploader.upload_chunked_stream
        : cloudinary.uploader.upload_stream;
    const stream = uploader(
      resourceType === "video" ? { ...opts, chunk_size: 20 * 1024 * 1024 } : opts,
      (error, result) => {
      if (error) reject(error);
      else resolve(result);
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

export async function destroy(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

export default {
  uploadFromUrl,
  uploadBuffer,
  destroy,
  destroyByPublicId,
  listFolderResources,
  cloudinary,
};
