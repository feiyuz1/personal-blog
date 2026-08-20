/**
 * 校验写请求（POST/PUT/PATCH/DELETE）的 Origin 头，作为 CSRF 纵深防御。
 * 浏览器对同源写请求也会带上 Origin；非浏览器客户端（如 curl）需自行携带。
 * APP_ORIGIN 需与站点公开源一致；多个受信任来源用英文逗号分隔（不要带末尾斜杠）。
 */
export function verifySameOrigin(request: Request): boolean {
  const allowedOrigins = process.env.APP_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean);

  if (!allowedOrigins?.length) {
    // fail-closed：未配置 APP_ORIGIN 时拒绝所有写请求，避免误开放。
    return false;
  }

  const origin = request.headers.get("origin");
  return allowedOrigins.includes(origin ?? "");
}
