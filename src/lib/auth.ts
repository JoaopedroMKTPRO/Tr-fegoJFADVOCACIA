import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "jf_session";
const ALG = "HS256";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET não definido");
  return new TextEncoder().encode(secret);
}

export async function signSession(): Promise<string> {
  return await new SignJWT({ ok: true })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    return true;
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySession(store.get(COOKIE_NAME)?.value);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < input.length; i++) {
    diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export const SESSION_COOKIE = COOKIE_NAME;
