import { NextRequest } from "next/server";

import { ok, unauthorized } from "@/lib/api-response";
import { loginAdmin } from "@/services/admin-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return ok(null, "用户名和密码不能为空");
    }

    const result = await loginAdmin(username, password);

    if (!result.success) {
      return unauthorized(result.error ?? "登录失败");
    }

    // TODO: 设置会话 Cookie 或 JWT 令牌
    // 目前直接返回用户信息
    return ok({
      user: result.user,
      token: "dev-session-placeholder",
    });
  } catch (error) {
    console.error("Login error:", error);
    return unauthorized("服务器内部错误");
  }
}
