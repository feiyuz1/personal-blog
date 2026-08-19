import { badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api-response";
import { getAdminSession } from "@/lib/auth/session";
import { verifySameOrigin } from "@/lib/request-origin";
import { countPostsByTag, deleteTag, updateTag } from "@/services/admin-service";

/**
 * 标签单条操作路由：PUT 更新、DELETE 删除。
 */

/** PUT /api/admin/tags/[id] - 更新标签（仅 name，不改 slug） */
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
    const body = (await request.json()) as { name?: string };

    const updated = await updateTag(numericId, {
      name: body.name?.trim(),
    });
    return ok(updated, "更新成功");
  } catch (error) {
    console.error("Admin tags PUT error:", error);
    return badRequest("更新失败");
  }
}

/** DELETE /api/admin/tags/[id] - 删除标签（有文章引用时拒绝） */
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

    // 删除前检查是否被文章引用
    const count = await countPostsByTag(numericId);
    if (count > 0) {
      return badRequest(`该标签被 ${count} 篇文章引用，请先取消关联后再删除`);
    }

    await deleteTag(numericId);
    return ok({ deleted: true }, "删除成功");
  } catch (error) {
    console.error("Admin tags DELETE error:", error);
    return notFound("标签不存在或删除失败");
  }
}
