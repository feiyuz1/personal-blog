import { requireAdmin } from "@/lib/auth/session";
import { AdminCommentsPage as AdminCommentsClient } from "@/modules/admin/admin-comments-page";
import { listAllComments } from "@/services/admin-service";
import { CommentStatus } from "@prisma/client";

// 评论状态枚举到中文标签的映射
const STATUS_LABEL: Record<CommentStatus, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已拒绝",
};

const PAGE_SIZE = 20;
const DEFAULT_STATUS = "PENDING";

/**
 * 评论审核页（服务端组件）。
 * 服务端预取「待审核」状态的第一页数据传入客户端组件；
 * 状态切换、翻页、审核操作由客户端组件请求 API 完成。
 */
export default async function AdminCommentsPage() {
  await requireAdmin();

  const result = await listAllComments({
    page: 1,
    pageSize: PAGE_SIZE,
    status: DEFAULT_STATUS,
  });

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

  return (
    <AdminCommentsClient
      initialRows={rows}
      initialTotal={result.total}
      initialPage={result.page}
      pageSize={PAGE_SIZE}
      initialStatus={DEFAULT_STATUS}
    />
  );
}
