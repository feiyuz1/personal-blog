import { badRequest, forbidden, ok, unauthorized } from "@/lib/api-response";
import { getAdminSession } from "@/lib/auth/session";
import { verifySameOrigin } from "@/lib/request-origin";
import {
  createCategory,
  listAllCategories,
} from "@/services/admin-service";

// 校验 slug 格式：仅小写字母、数字、短横线，长度 2-50
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,49}$/.test(slug);
}

/** GET /api/admin/categories - 获取分类列表（含关联文章数） */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const categories = await listAllCategories();
    const rows = categories.map((category) => ({
      id: String(category.id),
      values: {
        name: category.name,
        slug: category.slug,
        description: category.description ?? "",
        count: String(category._count.posts),
      },
    }));
    return ok(rows);
  } catch (error) {
    console.error("Admin categories GET error:", error);
    return ok([], "查询失败");
  }
}

/** POST /api/admin/categories - 新建分类 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }
  if (!verifySameOrigin(request)) {
    return forbidden("来源校验失败");
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      description?: string;
    };

    if (!body.name?.trim() || !body.slug?.trim()) {
      return badRequest("名称和 slug 不能为空");
    }
    if (!isValidSlug(body.slug)) {
      return badRequest("slug 仅允许小写字母、数字、短横线，长度 2-50");
    }

    const created = await createCategory({
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description?.trim() || undefined,
    });
    return ok(created, "创建成功");
  } catch (error) {
    // Prisma P2002 = 唯一约束冲突（slug 重复）
    const cause = error as { code?: string };
    if (cause.code === "P2002") {
      return badRequest("slug 已存在，请更换");
    }
    console.error("Admin categories POST error:", error);
    return badRequest("创建失败");
  }
}
