import { NextRequest } from "next/server";
import { ok, notFound } from "@/lib/api-response";
import { reviewComment } from "@/services/admin-service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body as { action?: "approve" | "reject" | "delete" };

    if (!action || !["approve", "reject", "delete"].includes(action)) {
      return ok(null, "action 必须是 approve、reject 或 delete");
    }

    const commentId = BigInt(id);

    switch (action) {
      case "delete": {
        await reviewComment(commentId, "delete");
        return ok({ deleted: true }, "评论已删除");
      }
      default:
        const updated = await reviewComment(commentId, action);
        return ok(updated, `评论已${action === "approve" ? "通过" : "拒绝"}`);
    }
  } catch (error) {
    console.error("Comment review error:", error);
    return notFound("评论不存在或操作失败");
  }
}
