import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/token";

/**
 * 乐观鉴权层（Next.js 16 proxy 约定）。
 *
 * 作用：未登录访问 /admin/* 时提前重定向到登录页，避免页面组件层再兜底，
 * 提升未登录访问后台的体验。
 *
 * 安全边界说明：
 *   这一层不是权威校验，只是"提前拦截"以减少不必要的渲染。
 *   真正的权威校验在 Server Page（requireAdmin）和 Route Handler
 *   （getAdminSession）里——即使 proxy 被绕过，未登录请求仍会被这两层挡下。
 *
 * 命名约定（Next.js 16+）：
 *   Next.js 16 起，约定文件名从 `middleware.ts` 改为 `proxy.ts`，
 *   导出函数名也改为 `proxy`。本项目此前误判将其重命名为 middleware，
 *   现已更正回 proxy 约定。
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 登录页本身放行，避免重定向成环。
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // 仅对后台路径生效（由下方 matcher 限定）。
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);

    // 未登录或非管理员角色，统一重定向到登录页。
    if (!session || session.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // 仅拦截 /admin 开头的路径，避免影响前台页面与公开 API。
  matcher: ["/admin/:path*"],
};
