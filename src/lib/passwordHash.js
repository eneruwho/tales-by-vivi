// Password hashing built on the Web Crypto API, which is native on Cloudflare
// Workers, Node and browsers. The previous argon2 verifier (hash-wasm) compiles
// WebAssembly from bytes at runtime, which Workers forbid, so admin login
// failed with "WebAssembly.compile(): Wasm code generation disallowed".
//
// Stored format: pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>
// The iteration count travels with each hash. 100,000 costs ~19ms of CPU, which
// exceeds the 10ms limit of the free Workers plan, so the default is lower
// (~5ms). On a paid plan, re-run `npm run seed:admin` with
// PASSWORD_HASH_ITERATIONS=100000 (Workers accept at most 100,000).

const SCHEME = "pbkdf2-sha256";
const DEFAULT_ITERATIONS = 25_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

const encoder = new TextEncoder();

function toBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password, iterations = DEFAULT_ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(String(password), salt, iterations);
  return [SCHEME, iterations, toBase64(salt), toBase64(hash)].join("$");
}

// Returns { ok, legacy }. `legacy` is true for old argon2 hashes, which cannot
// be checked on Workers; the password must be re-set with `npm run seed:admin`.
export async function verifyPassword(password, stored) {
  const value = String(stored || "");
  if (value.startsWith("$argon2")) return { ok: false, legacy: true };

  const [scheme, iterations, salt, hash] = value.split("$");
  const count = Number(iterations);
  if (scheme !== SCHEME || !Number.isInteger(count) || count < 1 || !salt || !hash) {
    return { ok: false, legacy: false };
  }

  try {
    const expected = fromBase64(hash);
    const actual = await derive(String(password), fromBase64(salt), count);
    return { ok: timingSafeEqual(actual, expected), legacy: false };
  } catch {
    return { ok: false, legacy: false };
  }
}
