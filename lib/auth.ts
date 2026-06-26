import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "avalabs_session";
const SALT_LEN = 16;
const KEY_LEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET env variable must be set and at least 16 characters"
    );
  }
  return secret;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS).toString("hex");
  return `${salt}.${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(".");
  if (!salt || !hash) return false;
  const computed = scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS);
  const hashBuf = Buffer.from(hash, "hex");
  return hashBuf.length === computed.length && timingSafeEqual(computed, hashBuf);
}

function sign(value: string): string {
  const secret = getSecret();
  return createHmac("sha256", secret).update(value).digest("hex");
}

function createSessionCookie(userId: string): string {
  const payload = Buffer.from(userId, "utf8").toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function verifySessionCookie(cookieValue: string): string | null {
  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))) {
    return null;
  }
  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

import { auth, currentUser } from "@clerk/nextjs/server";

export async function getSession() {
  const { userId } = await auth();
  if (!userId) return null;

  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      socialMediaUsername: true,
      fieldOfInterest: true,
      profession: true,
    },
  });

  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    // Check if user exists with this email (registered before Clerk migration)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update ID to the Clerk ID
      user = await prisma.user.update({
        where: { email },
        data: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          socialMediaUsername: true,
          fieldOfInterest: true,
          profession: true,
        },
      });
    } else {
      // Create new user in our DB
      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          username: clerkUser.username || clerkUser.firstName || "kullanici",
          passwordHash: "clerk-auth", // placeholder for required field
        },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          socialMediaUsername: true,
          fieldOfInterest: true,
          profession: true,
        },
      });
    }
  }

  return user;
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionCookie(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 gün
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
