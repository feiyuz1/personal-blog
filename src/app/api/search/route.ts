import { NextRequest } from "next/server";

import { ok } from "@/lib/api-response";
import { listPosts } from "@/services/content-service";

export async function GET(request: NextRequest) {
  const keyword =
    request.nextUrl.searchParams.get("keyword")?.trim().toLowerCase() ?? "";
  const posts = await listPosts();
  const result = keyword
    ? posts.filter(
        (post) =>
          post.title.toLowerCase().includes(keyword) ||
          post.summary.toLowerCase().includes(keyword),
      )
    : posts;

  return ok({
    keyword,
    list: result,
    total: result.length,
    note: "当前搜索为 mock 过滤，后续可替换为 PostgreSQL 或全文检索方案。",
  });
}
