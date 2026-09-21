import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

type Session = { userId: string; role: "CUSTOMER" | "SELLER" | "ADMIN"; iat: number };

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  return value;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha256", salt).update(password).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = createHmac("sha256", salt).update(password).digest("hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export function createSessionToken(userId: string, role: Session["role"]) {
  const payload = Buffer.from(JSON.stringify({ userId, role, iat: Date.now() } satisfies Session)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function parseSession(token?: string): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (!session.userId || !session.role || Date.now() - session.iat > 1000 * 60 * 60 * 24 * 30) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  try {
    return parseSession(store.get("directe_session")?.value);
  } catch {
    return null;
  }
}

export async function requireAuth(roles?: Session["role"][]) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (roles && !roles.includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}
