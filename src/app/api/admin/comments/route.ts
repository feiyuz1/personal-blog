import { ok, unauthorized } from "@/lib/api-response";
import { getAdminSession } from "@/lib/auth/session";
import { listAllComments } from "@/services/admin-service";
import { CommentStatus } from "@prisma/client";

// 评论状态枚举到中文标签的映射，用于列表展示
const STATUS_LABEL: Record<CommentStatus, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已拒绝",
};

/**
 * GET /api/admin/comments
 *
 * 查询评论列表，支持分页与按状态筛选。
 * 查询参数：
 *  - page: 页码，默认 1
 *  - pageSize: 每页条数，默认 20
 *  - status: 状态筛选（PENDING / APPROVED / REJECTED / all），默认 PENDING
 */
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
  const status = searchParams.get("status") ?? "PENDING";

  const result = await listAllComments({ page, pageSize, status });

  // 将数据库记录映射为表格行结构，与前端 Column 定义对齐
  const rows = result.list.map((comment) => ({
    id: String(comment.id),
    values: {
      author: comment.nickname,
      email: comment.email ?? "-",
      postTitle: comment.post?.title ?? "-",
      excerpt: comment.content.slice(0, 80),
      status: STATUS_LABEL[comment.status],
      createdAt: comment.createdAt.toISOString().replace("T", " ").slice(0, 16),
    },
  }));

  return ok({
    rows,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  });
}
