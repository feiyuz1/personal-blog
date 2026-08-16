import { ok, unauthorized } from "@/lib/api-response";
import { getAdminSession } from "@/lib/auth/session";
import { listAllCategories, listAllTags } from "@/services/admin-service";

/** GET /api/admin/categories - 获取后台界面所需的分类和标签 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const [categories, tags] = await Promise.all([listAllCategories(), listAllTags()]);

    const rows = [
      ...categories.map((category) => ({
        id: String(category.id),
        values: {
          _type: "分类",
          name: category.name,
          slug: category.slug,
          count: String(category._count.posts),
        },
      })),
      ...tags.map((tag) => ({
        id: String(tag.id),
        values: {
          _type: "标签",
          name: tag.name,
          slug: tag.slug,
          count: String(tag._count.postTags),
        },
      })),
    ];

    return ok(rows);
  } catch (error) {
    console.error("Admin categories GET error:", error);
    return ok([], "查询失败");
  }
}
