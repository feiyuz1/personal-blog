import { forbidden, ok, unauthorized } from "@/lib/api-response";
import { clearSessionCookie, getAdminSession } from "@/lib/auth/session";
import { verifySameOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }

  if (!verifySameOrigin(request)) {
    return forbidden("来源校验失败");
  }

  await clearSessionCookie();
  return ok(null, "已退出登录");
}
