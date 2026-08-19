import { badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api-response";
import { getAdminSession } from "@/lib/auth/session";
import { verifySameOrigin } from "@/lib/request-origin";
import {
  countPostsByCategory,
  deleteCategory,
  updateCategory,
} from "@/services/admin-service";

/**
 * 分类单条操作路由：PUT 更新、DELETE 删除。
 * 路径参数 id 为分类主键。
 */

/** PUT /api/admin/categories/[id] - 更新分类（名称/描述，不改 slug） */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }
  if (!verifySameOrigin(request)) {
    return forbidden("来源校验失败");
  }

  try {
    const { id } = await params;
    const numericId = BigInt(id);
    const body = (await request.json()) as {
      name?: string;
      description?: string;
    };

    const updated = await updateCategory(numericId, {
      name: body.name?.trim(),
      description: body.description?.trim(),
    });
    return ok(updated, "更新成功");
  } catch (error) {
    console.error("Admin categories PUT error:", error);
    return badRequest("更新失败");
  }
}

/** DELETE /api/admin/categories/[id] - 删除分类（有关联文章时拒绝） */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }
  if (!verifySameOrigin(request)) {
    return forbidden("来源校验失败");
  }

  try {
    const { id } = await params;
    const numericId = BigInt(id);

    // 删除前检查是否被文章引用，避免误删导致文章分类字段悬空
    const count = await countPostsByCategory(numericId);
    if (count > 0) {
      return badRequest(`该分类下有 ${count} 篇文章，请先迁移或改分类后再删除`);
    }

    await deleteCategory(numericId);
    return ok({ deleted: true }, "删除成功");
  } catch (error) {
    console.error("Admin categories DELETE error:", error);
    return notFound("分类不存在或删除失败");
  }
}
