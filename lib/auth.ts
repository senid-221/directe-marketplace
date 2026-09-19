import { createHmac, randomBytes } from "crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha256", salt).update(password).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = createHmac("sha256", salt).update(password).digest("hex");
  return actual === expected;
}

export function createSessionToken(userId: string, role: string) {
  const secret = process.env.JWT_SECRET || "change-this-in-production";
  const payload = Buffer.from(JSON.stringify({ userId, role, iat: Date.now() })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
