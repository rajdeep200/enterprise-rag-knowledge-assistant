import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { AppError, Errors } from "@/lib/api-response";

export const AUTH_COOKIE = "rag_session";
const JWT_ISSUER = "rag-knowledge-assistant";
const JWT_EXPIRY = "7d";

const secretKey = new TextEncoder().encode(env.JWT_SECRET);

/** Payload we embed in the JWT. companyId is included so most checks need no DB hit. */
export interface AuthTokenPayload {
  userId: string;
  companyId: string;
  role: UserRole;
  email: string;
}

/** Authenticated user shape returned to routes/services — never includes passwordHash. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  companyName: string;
}

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// JWT generation / verification (jose — works in Node and Edge runtimes)
// ---------------------------------------------------------------------------
export async function signToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(JWT_EXPIRY)
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, { issuer: JWT_ISSUER });
    return {
      userId: String(payload.userId),
      companyId: String(payload.companyId),
      role: payload.role as UserRole,
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------
export async function setAuthCookie(token: string): Promise<void> {
  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAuthCookie(): void {
  cookies().delete(AUTH_COOKIE);
}

// ---------------------------------------------------------------------------
// Server-side auth helpers
// ---------------------------------------------------------------------------

/** Returns the current user or null. Use in places where auth is optional. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      company: { select: { name: true } },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    companyName: user.company.name,
  };
}

/** Throws 401 if not logged in. Returns the user otherwise. */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw Errors.unauthorized();
  return user;
}

/** Throws 401 if not logged in, 403 if not an ADMIN. */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw Errors.forbidden();
  return user;
}

export { AppError };
