import { unlink } from "fs/promises";
import { basename, join } from "path";

import { badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api-response";
import { getAdminSession } from "@/lib/auth/session";
import { verifySameOrigin } from "@/lib/request-origin";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/admin/media/[id]
 *
 * 删除一条媒体记录：先删除磁盘上的物理文件，再删除数据库记录。
 * 物理文件删除失败不阻断流程（例如文件已被手动移走），仅记录日志，
 * 以保证数据库记录可被正常清理，避免出现"删不掉的孤儿记录"。
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. 鉴权：仅管理员可删除媒体
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }

  // 2. 同源校验：防止跨站请求伪造
  if (!verifySameOrigin(request)) {
    return forbidden("来源校验失败");
  }

  // 3. 解析路径参数 id
  const { id } = await params;
  const numericId = BigInt(id);
  if (!numericId) {
    return badRequest("非法的媒体 ID");
  }

  // 4. 查询记录，确认存在并拿到磁盘路径
  const media = await prisma.mediaFile.findUnique({ where: { id: numericId } });
  if (!media) {
    return notFound("媒体不存在");
  }

  // 5. 删除磁盘文件。fileUrl 形如 /uploads/xxx.png，对应 public/uploads/xxx.png。
  //    仅处理 /uploads 前缀的本地文件，避免误删其它路径。
  if (media.fileUrl.startsWith("/uploads/")) {
    const fileName = basename(media.fileUrl);
    const uploadDir = process.env.MEDIA_UPLOAD_DIR ?? join(process.cwd(), "public", "uploads");
    const filePath = join(uploadDir, fileName);
    try {
      await unlink(filePath);
    } catch (error) {
      // 文件可能已被手动删除，这里只记录日志，不阻断数据库清理。
      console.warn(`[media] 磁盘文件删除失败（忽略）: ${filePath}`, error);
    }
  }

  // 6. 删除数据库记录
  await prisma.mediaFile.delete({ where: { id: numericId } });

  return ok({ deleted: true }, "删除成功");
}
