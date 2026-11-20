import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** Hex SHA-256 of arbitrary input. Used for tokens, emails keys, and recovery codes. */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Opaque random value for cookies and email links (base64url). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

const KEY_VERSION = 1;

/**
 * Reads `IDENTITY_ENCRYPTION_KEY` as 32 bytes of base64. Missing/invalid keys
 * fail closed when encryption is required.
 */
function encryptionKey(): Buffer {
  const raw = process.env.IDENTITY_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("IDENTITY_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("IDENTITY_ENCRYPTION_KEY must be 32 bytes (base64)");
  }
  return key;
}

/**
 * Seals plaintext with AES-256-GCM. Format: `v1:<iv_b64>:<tag_b64>:<ct_b64>`.
 */
export function seal(plaintext: string): { sealed: string; keyVersion: number } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const sealed = [
    `v${KEY_VERSION}`,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
  return { sealed, keyVersion: KEY_VERSION };
}

/** Opens a value sealed by `seal`. Plaintext legacy secrets are returned as-is. */
export function open(stored: string, keyVersion: number | null): string {
  if (!keyVersion || !stored.startsWith("v")) {
    // Copied CityCatalyst rows store the TOTP secret in clear text.
    return stored;
  }
  const [version, ivB64, tagB64, ctB64] = stored.split(":");
  if (version !== `v${KEY_VERSION}` || !ivB64 || !tagB64 || !ctB64) {
    throw new Error("Invalid sealed secret format");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
