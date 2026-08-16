import { NextRequest } from "next/server";

import { ok, tooManyRequests, unauthorized } from "@/lib/api-response";
import { createAdminSession } from "@/lib/auth/session";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { loginAdmin } from "@/services/admin-service";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return unauthorized("用户名和密码不能为空");
    }

    const ipKey = `ip:${getClientIp(request)}`;
    const userKey = `user:${username.trim().toLowerCase()}`;

    const ipCheck = checkRateLimit(ipKey);
    const userCheck = checkRateLimit(userKey);

    if (!ipCheck.allowed || !userCheck.allowed) {
      console.warn(`[admin] login rate-limited: ip=${ipKey} user=${userKey}`);
      return tooManyRequests("尝试次数过多，请稍后再试");
    }

    const result = await loginAdmin(username, password);

    if (!result.success || !result.user) {
      return unauthorized(result.error ?? "登录失败");
    }

    if (result.user.role.toLowerCase() !== "admin") {
      return unauthorized("无后台访问权限");
    }

    // 登录成功即清零该用户 / 该 IP 的计数，避免锁定期跨越成功登录。
    resetRateLimit(ipKey);
    resetRateLimit(userKey);

    await createAdminSession({
      userId: result.user.id,
      username: result.user.username,
      role: result.user.role,
    });

    return ok({
      user: {
        id: result.user.id,
        username: result.user.username,
        role: result.user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return unauthorized("服务器内部错误");
  }
}
