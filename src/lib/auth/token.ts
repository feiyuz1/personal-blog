import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "admin_session";

export type SessionPayload = {
  userId: string;
  username: string;
  role: string;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET 未配置");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  user: SessionPayload,
): Promise<string> {
  return new SignJWT({
    username: user.username,
    // UserRole 枚举值是 "ADMIN"/"EDITOR"（大写），统一转小写存进 JWT，
    // 以便后续 getAdminSession / proxy 用 `role === "admin"` 判断。
    role: user.role.toLowerCase(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token?: string,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    // JWT 过期、篡改、签名错误、算法不符等统一视为未登录。
    return null;
  }
}
