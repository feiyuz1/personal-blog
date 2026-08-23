import { forbidden, ok, unauthorized } from "@/lib/api-response";
import { getAdminSession } from "@/lib/auth/session";
import { verifySameOrigin } from "@/lib/request-origin";
import { createPost, listAllPosts } from "@/services/admin-service";

/** GET /api/admin/posts - 文章列表（后台视图，含草稿） */
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
    const keyword = searchParams.get("keyword") ?? "";
    const status = searchParams.get("status") ?? "";

    const result = await listAllPosts({
      page,
      pageSize,
      keyword,
      status: status || undefined,
    });

    const rows = result.list.map((post) => ({
      id: String(post.id),
      values: {
        title: post.title,
        status:
          post.status === "PUBLISHED"
            ? post.isTop
              ? "已发布(精华)"
              : "已发布"
            : post.status === "DRAFT"
              ? "草稿"
              : "已下线",
        category: post.category?.name ?? "-",
        updatedAt: post.updatedAt.toISOString().split("T")[0],
      },
    }));

    return ok({ ...result, rows });
  } catch (error) {
    console.error("Admin posts GET error:", error);
    return ok(
      { list: [], total: 0, page: 1, pageSize: 20, rows: [] },
      "查询出错",
    );
  }
}

/** POST /api/admin/posts - 创建新文章 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }

  if (!verifySameOrigin(request)) {
    return forbidden("来源校验失败");
  }

  let postSlug = "";

  try {
    const body = await request.json();
    const {
      title,
      slug,
      summary,
      content,
      readingTime,
      categoryId,
      isTop,
      status,
      tagSlugs,
    } = body as {
      title?: string;
      slug?: string;
      summary?: string;
      content?: string;
      readingTime?: string;
      categoryId?: number | null;
      isTop?: boolean;
      status?: "DRAFT" | "PUBLISHED" | "OFFLINE";
      tagSlugs?: string[];
    };

    postSlug = slug ?? "";

    if (!title || !postSlug) {
      return ok(null, "标题和 slug 不能为空");
    }

    const post = await createPost({
      title,
      slug: postSlug,
      summary,
      content: content ?? "",
      readingTime,
      categoryId,
      isTop,
      status,
      tagSlugs,
      authorId: BigInt(session.userId),
    });

    return ok(post);
  } catch (error) {
    console.error("Admin posts POST error:", error);
    const cause = error as { code?: string; message?: string };

    if (cause.code === "P2002") {
      return ok(null, `slug "${postSlug}" 已存在，请更换`);
    }

    return ok(null, `创建失败：${cause.message ?? "未知错误"}`);
  }
}
