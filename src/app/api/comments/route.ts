import { ok } from "@/lib/api-response";

export async function POST(request: Request) {
  // TODO: 接入 Prisma 实现真实评论系统
  // 目前仅确认收到提交
  const body = await request.json().catch(() => null);
  console.log("Comment submitted:", body);

  return ok({ received: true }, "评论已收到（审核功能待完善）");
}
