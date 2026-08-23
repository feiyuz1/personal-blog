import { NextRequest } from "next/server";

import {
  badRequest,
  internalServerError,
  ok,
  tooManyRequests,
} from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const NAME_MAX = 100;
const EMAIL_MAX = 191;
const MESSAGE_MAX = 5000;

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`contact:${ip}`).allowed) {
    return tooManyRequests("留言过于频繁，请稍后再试");
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    message?: string;
  } | null;
  const name = body?.name?.trim().slice(0, NAME_MAX) ?? "";
  const email = body?.email?.trim().slice(0, EMAIL_MAX) ?? "";
  const message = body?.message?.trim().slice(0, MESSAGE_MAX) ?? "";

  if (!name || !email || !message)
    return badRequest("称呼、邮箱和留言内容不能为空");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return badRequest("邮箱格式不正确");

  try {
    await prisma.contactMessage.create({ data: { name, email, message, ip } });
    return ok({ submitted: true }, "留言已提交，我们会尽快回复");
  } catch (error) {
    console.error("Contact message create error:", error);
    return internalServerError("留言暂时无法提交，请稍后再试");
  }
}
