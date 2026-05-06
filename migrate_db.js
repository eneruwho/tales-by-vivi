const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const argon2 = require("argon2");

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
}

const dataPath = path.join(__dirname, "data.json");

function initFirestore() {
  if (admin.apps.length) return admin.firestore();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

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

async function main() {
  if (!fs.existsSync(dataPath)) {
    console.log("No data store found. Nothing to migrate.");
    return;
  }

  const db = initFirestore();
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const projects = Array.isArray(data.projects) ? data.projects : [];
  const artists = Array.isArray(data.artists) ? data.artists : [];

  let migratedProjects = 0;
  let migratedArtists = 0;

  for (const project of projects) {
    const next = {
      ...project,
      slug: project.slug || slugify(project.title),
      artistSlug: project.artistSlug || slugify(project.artist),
      imageUrls: Array.isArray(project.imageUrls)
        ? project.imageUrls
        : project.imageUrl
          ? [project.imageUrl]
          : [],
      videoUrls: Array.isArray(project.videoUrls)
        ? project.videoUrls
        : project.videoUrl
          ? [project.videoUrl]
          : [],
    };
    await db
      .collection("projects")
      .doc(String(next.id))
      .set(next, { merge: true });
    migratedProjects += 1;
  }

  for (const artist of artists) {
    const next = {
      ...artist,
      slug: artist.slug || slugify(artist.name),
    };
    await db
      .collection("artists")
      .doc(String(next.id))
      .set(next, { merge: true });
    migratedArtists += 1;
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const passwordHash = await argon2.hash(process.env.ADMIN_PASSWORD);
    await db.collection("admin").doc(process.env.ADMIN_EMAIL).set(
      {
        email: process.env.ADMIN_EMAIL,
        passwordHash,
        createdAt: new Date().toISOString(),
      },
      { merge: true },
    );
    console.log(`Seeded admin account for ${process.env.ADMIN_EMAIL}`);
  }

  console.log(
    `Migration complete. Projects: ${migratedProjects}, Artists: ${migratedArtists}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
