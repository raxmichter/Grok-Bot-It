import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Session = {
  userId: string;
  handle: string;
  name: string;
};

const COOKIE = "gbi_session";

function secret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(raw);
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function readSessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.handle !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      handle: payload.handle,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function setSessionCookie(session: Session): Promise<void> {
  const jar = await cookies();
  const token = await signSession(session);
  jar.set(COOKIE, token, cookieOpts);
}

export async function attachSession(
  res: { cookies: { set: (name: string, value: string, opts: typeof cookieOpts) => void } },
  session: Session,
): Promise<void> {
  res.cookies.set(COOKIE, await signSession(session), cookieOpts);
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function twitterConfigured(): boolean {
  return Boolean(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET);
}

export function allowDevAuth(): boolean {
  if (process.env.ALLOW_DEV_AUTH === "true") return true;
  if (process.env.ALLOW_DEV_AUTH === "false") return false;
  return process.env.NODE_ENV !== "production";
}
