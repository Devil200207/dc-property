import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "dc_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars). See .env.example");
  return s;
}

const sign = (payload: string) => crypto.createHmac("sha256", secret()).update(payload).digest("base64url");

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not set. See .env.example");
  // Hash both sides so length differences don't leak through timing.
  const h = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
  return safeEqual(h(input), h(expected));
}

export async function createSession() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [exp, mac] = value.split(".");
  if (!exp || !mac || !safeEqual(mac, sign(exp))) return false;
  return Number(exp) * 1000 > Date.now();
}

/** Use at the top of every admin page. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Use inside server actions / route handlers. */
export async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

// Basic brute-force protection for the login form (per server process).
const attempts = new Map<string, { count: number; until: number }>();
export function loginRateLimited(ip: string): boolean {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || a.until < now) {
    attempts.set(ip, { count: 1, until: now + 15 * 60 * 1000 });
    return false;
  }
  a.count++;
  return a.count > 8;
}
export const clearLoginAttempts = (ip: string) => attempts.delete(ip);
