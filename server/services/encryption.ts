import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // initialization vector length
const key = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, "hex")
  : Buffer.from(
      "9f8c3b6d1a2e4f7c8b0d5e1f3a6c7d2e9a1b4c5d6e7f8091b2c3d4e5f6a7b8c9",
      "hex",
    );

export function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
    authTag,
  };
}

export interface EncryptedObject {
  iv: string | Buffer;
  encryptedData: string | Buffer;
  authTag?: string | Buffer;
}

export function decrypt(encryptedObj: EncryptedObject): string {
  const { iv, encryptedData, authTag } = encryptedObj;

  if (!authTag) {
    throw new Error("Authentication tag is missing. Cannot decrypt.");
  }

  // Ensure the correct types are passed (Buffer)
  const ivBuffer = Buffer.isBuffer(iv) ? iv : Buffer.from(iv, "hex");
  const encryptedBuffer = Buffer.isBuffer(encryptedData)
    ? encryptedData
    : Buffer.from(encryptedData, "hex");
  const authTagBuffer = Buffer.isBuffer(authTag)
    ? authTag
    : Buffer.from(authTag, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(encryptedBuffer, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function encryptField(value: string | any): string | null {
  if (!value) return null;

  if (typeof value == "object") {
    value = JSON.stringify(value);
  }

  const encrypted = encrypt(value);
  return JSON.stringify(encrypted);
}

export function decryptField(encryptedJson: string | null): string | null {
  if (!encryptedJson) return null;

  try {
    const encyrptedObj = JSON.parse(encryptedJson);
    return decrypt(encyrptedObj);
  } catch (error) {
    console.error("Error decrypting field:", error);
    return null;
  }
}
