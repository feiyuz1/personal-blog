import { requireAdmin } from "@/lib/auth/session";
import { listAllPosts } from "@/services/admin-service";
import { AdminPostsPage as AdminPostsClient } from "@/modules/admin/admin-posts-page";

const PAGE_SIZE = 20;

/**
 * 文章管理页（服务端组件）。
 * 服务端预取第一页数据传入客户端组件，避免 useEffect 拉取闪烁；
 * 后续筛选/搜索/翻页由客户端组件请求 API 完成。
 */
export default async function AdminPostsRoute() {
  await requireAdmin();

  const result = await listAllPosts({ page: 1, pageSize: PAGE_SIZE });

  const rows = result.list.map((post) => ({
    id: String(post.id),
    values: {
      title: post.title,
      status:
        post.status === "PUBLISHED"
          ? post.isTop
            ? "已发布(置顶)"
            : "已发布"
          : post.status === "DRAFT"
            ? "草稿"
            : "已下线",
      category: post.category?.name ?? "-",
      updatedAt: post.updatedAt.toISOString().split("T")[0],
    },
  }));

  return (
    <AdminPostsClient
      initialRows={rows}
      initialTotal={result.total}
      initialPage={result.page}
      pageSize={PAGE_SIZE}
      initialStatus=""
      initialKeyword=""
    />
  );
}
