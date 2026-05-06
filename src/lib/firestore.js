import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKey) {
    // Do not crash on missing env in dev; exports will be undefined
    console.warn(
      "Firebase admin credentials not fully provided; Firestore disabled",
    );
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

export const db = admin.apps.length ? admin.firestore() : null;

export const collections = db
  ? {
      admins: db.collection("admin"),
      projects: db.collection("projects"),
      artists: db.collection("artists"),
      otps: db.collection("otps"),
      sessions: db.collection("sessions"),
      clients: db.collection("clients"),
      settings: db.collection("settings"),
    }
  : null;

export async function addOtpRecord(record) {
  if (!db) throw new Error("Firestore not initialized");
  return collections.otps.add(record);
}

export async function getLatestOtpForEmail(email) {
  if (!db) throw new Error("Firestore not initialized");
  const q = await collections.otps
    .where("email", "==", email)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();
  if (q.empty) return null;
  const doc = q.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function createSession(session) {
  if (!db) throw new Error("Firestore not initialized");
  return collections.sessions.add(session);
}

export async function getSessionById(sessionId) {
  if (!db) throw new Error("Firestore not initialized");
  const q = await collections.sessions
    .where("sessionId", "==", sessionId)
    .limit(1)
    .get();
  if (q.empty) return null;
  const doc = q.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getAdminByEmail(email) {
  if (!db) throw new Error("Firestore not initialized");
  const q = await collections.admins.where("email", "==", email).limit(1).get();
  if (q.empty) return null;
  return { id: q.docs[0].id, ...q.docs[0].data() };
}

export async function getSiteSettings() {
  if (!db) throw new Error("Firestore not initialized");
  const snap = await collections.settings.doc("site").get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function setSiteSettings(updates) {
  if (!db) throw new Error("Firestore not initialized");
  await collections.settings.doc("site").set(updates, { merge: true });
  return getSiteSettings();
}

export async function getClientLogos() {
  if (!db) throw new Error("Firestore not initialized");
  const snap = await collections.clients.get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function addClientLogos(logos) {
  if (!db) throw new Error("Firestore not initialized");
  const batch = db.batch();
  logos.forEach((logo) => {
    const ref = collections.clients.doc();
    batch.set(ref, { ...logo, createdAt: new Date().toISOString() });
  });
  await batch.commit();
  return getClientLogos();
}

export default {
  db,
  collections,
  addOtpRecord,
  getLatestOtpForEmail,
  createSession,
  getSessionById,
  getAdminByEmail,
  getSiteSettings,
  setSiteSettings,
  getClientLogos,
  addClientLogos,
};
