// Creates or updates the admin login using the Workers-safe password hash.
// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... \
//        SUPABASE_SERVICE_ROLE_KEY=... npm run seed:admin
import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "../src/lib/passwordHash.js";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!url || !key || !email || !password) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL and ADMIN_PASSWORD.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const iterations =
  Math.min(Number(process.env.PASSWORD_HASH_ITERATIONS) || 0, 100_000) ||
  undefined;
const password_hash = await hashPassword(password, iterations);

const { data: existing, error: lookupError } = await supabase
  .from("admin")
  .select("id")
  .eq("email", email)
  .limit(1)
  .maybeSingle();
if (lookupError) throw lookupError;

const { error } = existing
  ? await supabase.from("admin").update({ password_hash }).eq("id", existing.id)
  : await supabase
      .from("admin")
      .insert({ email, password_hash, created_at: new Date().toISOString() });
if (error) throw error;

console.log(`${existing ? "Updated" : "Created"} admin ${email}`);
