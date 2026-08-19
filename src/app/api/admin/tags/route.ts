import { badRequest, forbidden, ok, unauthorized } from "@/lib/api-response";
import { getAdminSession } from "@/lib/auth/session";
import { verifySameOrigin } from "@/lib/request-origin";
import { createTag, listAllTags } from "@/services/admin-service";

// 校验 slug 格式：仅小写字母、数字、短横线，长度 2-50
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,49}$/.test(slug);
}

/** GET /api/admin/tags - 获取标签列表（含关联文章数） */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const tags = await listAllTags();
    const rows = tags.map((tag) => ({
      id: String(tag.id),
      values: {
        name: tag.name,
        slug: tag.slug,
        count: String(tag._count.postTags),
      },
    }));
    return ok(rows);
  } catch (error) {
    console.error("Admin tags GET error:", error);
    return ok([], "查询失败");
  }
}

/** POST /api/admin/tags - 新建标签 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }
  if (!verifySameOrigin(request)) {
    return forbidden("来源校验失败");
  }

  try {
    const body = (await request.json()) as { name?: string; slug?: string };

    if (!body.name?.trim() || !body.slug?.trim()) {
      return badRequest("名称和 slug 不能为空");
    }
    if (!isValidSlug(body.slug)) {
      return badRequest("slug 仅允许小写字母、数字、短横线，长度 2-50");
    }

    const created = await createTag({
      name: body.name.trim(),
      slug: body.slug.trim(),
    });
    return ok(created, "创建成功");
  } catch (error) {
    const cause = error as { code?: string };
    if (cause.code === "P2002") {
      return badRequest("slug 已存在，请更换");
    }
    console.error("Admin tags POST error:", error);
    return badRequest("创建失败");
  }
}
