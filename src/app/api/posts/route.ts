import { ok } from "@/lib/api-response";
import { listPosts } from "@/services/content-service";

export async function GET() {
  const posts = await listPosts();

  return ok({
    list: posts,
    total: posts.length,
    page: 1,
    pageSize: posts.length,
  });
}
