import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./token";

const SESSION_MAX_AGE = 60 * 60 * 24; // 24 小时

/**
 * 当前站点以 HTTP 对外（nginx:80，无 TLS），secure:true 会导致 Cookie 发不出去。
 * 待接入 HTTPS 后把 NEXT_PUBLIC_SITE_URL 改为 https:// 即可自动启用 secure。
 */
function isSecureCookie(): boolean {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return url.startsWith("https://");
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  if (!session.userId) {
    return null;
  }

  if (session.role !== "admin") {
    return null;
  }

  return session;
}

export async function createAdminSession(user: SessionPayload) {
  const token = await createSessionToken(user);
  const store = await cookies();

  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();

  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
