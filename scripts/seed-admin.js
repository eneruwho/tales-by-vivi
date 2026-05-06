const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const argon2 = require("argon2");

function parseEnvFile(filePath) {
  const env = {};
  const raw = fs.readFileSync(filePath, "utf8");

  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) return;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1);
    env[key] = value;
  });

  return env;
}

function getEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    return parseEnvFile(envPath);
  }
  return process.env;
}

async function main() {
  const env = getEnv();

  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY
    ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;
  const adminEmail = env.ADMIN_EMAIL;
  const adminPassword = env.ADMIN_PASSWORD;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase admin credentials in .env.local");
  }
  if (!adminEmail || !adminPassword) {
    throw new Error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env.local");
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  const passwordHash = await argon2.hash(adminPassword);
  await admin.firestore().collection("admin").doc(adminEmail).set(
    {
      email: adminEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  console.log(`Seeded admin account for ${adminEmail}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
