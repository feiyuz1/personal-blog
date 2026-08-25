const VISITOR_COOKIE_NAME = "mascot_visitor";
const VISITOR_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type MascotVisitor = {
  id: string;
  isNew: boolean;
  cookie?: string;
};

function parseCookieHeader(header: string | null) {
  const cookies = new Map<string, string>();
  for (const part of header?.split(";") ?? []) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    try {
      cookies.set(key, decodeURIComponent(value));
    } catch {
      // 忽略格式错误的 Cookie 值。
    }
  }
  return cookies;
}

export function resolveMascotVisitor(request: Request): MascotVisitor {
  const current = parseCookieHeader(request.headers.get("cookie")).get(
    VISITOR_COOKIE_NAME,
  );
  if (current && UUID_PATTERN.test(current)) {
    return { id: current, isNew: false };
  }

  const id = crypto.randomUUID();
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const secure =
    forwardedProtocol === "https" || new URL(request.url).protocol === "https:";
  const attributes = [
    `${VISITOR_COOKIE_NAME}=${id}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${VISITOR_MAX_AGE_SECONDS}`,
  ];
  if (secure) attributes.push("Secure");

  return { id, isNew: true, cookie: attributes.join("; ") };
}

export function attachMascotVisitorCookie(
  response: Response,
  visitor: MascotVisitor,
) {
  if (visitor.cookie) {
    response.headers.append("Set-Cookie", visitor.cookie);
  }
  return response;
}

export function getMascotClientIp(request: Request) {
  const candidate =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return candidate.slice(0, 64);
}
