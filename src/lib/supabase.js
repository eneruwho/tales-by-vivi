import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not fully provided; Supabase disabled");
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  : null;

export function isSupabaseReady() {
  return Boolean(supabase);
}

// Helpers for Auth / Sessions / OTPs / Settings / Clients

export async function addOtpRecord(record) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const { data, error } = await supabase.from("otps").insert({
    email: record.email,
    otp: record.otp,
    expires_at: record.expiresAt || record.expires_at,
    created_at: record.createdAt || new Date().toISOString(),
  }).select().single();

  if (error) throw error;
  return data;
}

export async function getLatestOtpForEmail(email) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const { data, error } = await supabase
    .from("otps")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    otp: data.otp,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
  };
}

export async function createSession(session) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const { data, error } = await supabase.from("sessions").insert({
    session_id: session.sessionId || session.session_id,
    email: session.email,
    expires_at: session.expiresAt || session.expires_at,
    created_at: session.createdAt || new Date().toISOString(),
  }).select().single();

  if (error) throw error;
  return data;
}

export async function getSessionById(sessionId) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("session_id", sessionId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    sessionId: data.session_id,
    email: data.email,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
  };
}

export async function getAdminByEmail(email) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const { data, error } = await supabase
    .from("admin")
    .select("*")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    passwordHash: data.password_hash,
    createdAt: data.created_at,
  };
}

export async function getSiteSettings() {
  if (!isSupabaseReady()) return null;
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", "site")
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  return data ? { id: data.id, ...data.data } : null;
}

export async function setSiteSettings(updates) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  
  // Get existing settings to merge
  const existing = await getSiteSettings();
  const merged = { ...(existing || {}), ...updates };
  delete merged.id;

  const { data, error } = await supabase
    .from("settings")
    .upsert({
      id: "site",
      data: merged,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return { id: "site", ...merged };
}

export async function getClientLogos() {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const { data, error } = await supabase.from("clients").select("*");
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    url: row.url,
    publicId: row.public_id,
    source: row.source,
    createdAt: row.created_at,
  }));
}

export async function addClientLogos(logos) {
  if (!isSupabaseReady()) throw new Error("Supabase not initialized");
  const rows = logos.map((logo) => ({
    url: logo.url,
    public_id: logo.publicId || logo.public_id || null,
    source: logo.source || "upload",
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("clients").insert(rows);
  if (error) throw error;
  return getClientLogos();
}

const supabaseClient = {
  supabase,
  isSupabaseReady,
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

export default supabaseClient;
