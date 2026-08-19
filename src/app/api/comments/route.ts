import { NextRequest } from "next/server";

import { badRequest, ok, tooManyRequests } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { CommentStatus, PostStatus } from "@prisma/client";
import { listApprovedComments } from "@/services/content-service";

// 评论字段长度限制
const NICKNAME_MAX = 50;
const CONTENT_MAX = 1000;

// 从请求头获取客户端 IP，用于限流 key
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// 基础文本净化：去掉首尾空白，截断超长内容，剥离 HTML 标签防 XSS。
// 评论为纯文本展示，不需要保留任何标签。
function sanitizeText(input: string, max: number): string {
  return input
    .trim()
    .slice(0, max)
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * GET /api/comments?postId=xxx
 *
 * 返回某篇文章下已通过审核的评论（树形结构）。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postIdParam = searchParams.get("postId");

  if (!postIdParam) {
    return badRequest("缺少 postId 参数");
  }

  let postId: bigint;
  try {
    postId = BigInt(postIdParam);
  } catch {
    return badRequest("postId 不合法");
  }

  const tree = await listApprovedComments(postId);
  return ok({ comments: tree });
}

/**
 * POST /api/comments
 *
 * 提交评论。评论默认进入 PENDING 待审核状态，审核通过后才会展示。
 * 限流：同一 IP 15 分钟内最多 10 条，防止刷评论。
 */
export async function POST(request: NextRequest) {
  // 1. 按 IP 限流
  const ipKey = `comment:ip:${getClientIp(request)}`;
  const limit = checkRateLimit(ipKey);
  if (!limit.allowed) {
    return tooManyRequests("评论过于频繁，请稍后再试");
  }

  // 2. 解析与校验请求体
  const body = (await request.json().catch(() => null)) as {
    postId?: string;
    parentId?: string;
    nickname?: string;
    email?: string;
    content?: string;
  } | null;

  if (!body) {
    return badRequest("请求体格式错误");
  }

  const { postId, parentId, nickname, email, content } = body;

  if (!postId) {
    return badRequest("缺少 postId");
  }

  let postIdBigInt: bigint;
  try {
    postIdBigInt = BigInt(postId);
  } catch {
    return badRequest("postId 不合法");
  }

  // 确认文章存在且已发布，避免对不存在/未发布文章刷评论
  const post = await prisma.post.findUnique({
    where: { id: postIdBigInt },
    select: { id: true, status: true },
  });
  if (!post || post.status !== PostStatus.PUBLISHED) {
    return badRequest("文章不存在或不可评论");
  }

  const cleanNickname = sanitizeText(nickname ?? "", NICKNAME_MAX);
  const cleanContent = sanitizeText(content ?? "", CONTENT_MAX);
  const cleanEmail = email?.trim().slice(0, 191) || null;

  if (!cleanNickname) {
    return badRequest("昵称不能为空");
  }
  if (!cleanContent) {
    return badRequest("评论内容不能为空");
  }
  // 邮箱格式校验（可选字段，填了才校验）
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return badRequest("邮箱格式不正确");
  }

  // parentId 校验：若提供，必须指向同一文章下的已存在评论
  let parentIdBigInt: bigint | null = null;
  if (parentId) {
    try {
      parentIdBigInt = BigInt(parentId);
    } catch {
      return badRequest("parentId 不合法");
    }
    const parent = await prisma.comment.findUnique({
      where: { id: parentIdBigInt },
      select: { id: true, postId: true },
    });
    if (!parent || parent.postId !== postIdBigInt) {
      return badRequest("父评论不存在或不属于该文章");
    }
  }

  // 3. 写入数据库，状态为待审核
  await prisma.comment.create({
    data: {
      postId: postIdBigInt,
      parentId: parentIdBigInt,
      nickname: cleanNickname,
      email: cleanEmail,
      content: cleanContent,
      status: CommentStatus.PENDING,
      ip: getClientIp(request),
    },
  });

  return ok({ submitted: true }, "评论已提交，审核通过后将展示");
}
