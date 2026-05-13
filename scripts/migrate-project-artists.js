const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function initFirestore() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const env = fs.existsSync(envPath)
    ? Object.fromEntries(
        fs
          .readFileSync(envPath, "utf8")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#") && line.includes("="))
          .map((line) => {
            const index = line.indexOf("=");
            return [line.slice(0, index).trim(), line.slice(index + 1)];
          }),
      )
    : process.env;

  if (admin.apps.length) return admin.firestore();

  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey =
    env.FIREBASE_PRIVATE_KEY && env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY",
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return admin.firestore();
}

function normalizeArtistSlugs(project) {
  const raw = project?.artistSlugs ?? project?.artistSlug ?? project?.artist;

  if (Array.isArray(raw)) {
    return raw
      .flatMap((item) => {
        if (!item) return [];
        if (typeof item === "object") {
          return [item.slug || item.name].filter(Boolean);
        }
        return [item];
      })
      .map((value) => String(value || "").trim())
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    const values = raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (project?.artistSlug || project?.artistSlugs) {
      return values;
    }

    if (values.length > 0) {
      return values.map((value) => slugify(value));
    }
  }

  return [];
}

async function main() {
  const db = initFirestore();
  const snap = await db.collection("projects").get();

  const before = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  let updatedCount = 0;
  for (const doc of snap.docs) {
    const project = doc.data();
    const artistSlugs = normalizeArtistSlugs(project);

    await doc.ref.set(
      {
        artistSlugs,
        artist: admin.firestore.FieldValue.delete(),
        artistSlug: admin.firestore.FieldValue.delete(),
      },
      { merge: true },
    );
    updatedCount += 1;
  }

  const afterSnap = await db.collection("projects").get();
  const after = afterSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log(
    JSON.stringify(
      {
        before: before.map((project) => ({
          id: project.id,
          title: project.title,
          artistSlug: project.artistSlug,
          artist: project.artist,
        })),
        after: after.map((project) => ({
          id: project.id,
          title: project.title,
          artistSlugs: project.artistSlugs,
          artist: project.artist ?? null,
          artistSlug: project.artistSlug ?? null,
        })),
        updatedCount,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
