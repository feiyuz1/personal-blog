import { randomUUID } from "crypto";

import { writeFile, mkdir } from "fs/promises";
import { basename, extname, join } from "path";

import { badRequest, forbidden, ok, payloadTooLarge, unauthorized } from "@/lib/api-response";
import { getAdminSession } from "@/lib/auth/session";
import { verifySameOrigin } from "@/lib/request-origin";
import { prisma } from "@/lib/prisma";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** GET /api/admin/media - 分页获取媒体文件列表 */
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

    const [list, total] = await Promise.all([
      prisma.mediaFile.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.mediaFile.count(),
    ]);

    const rows = list.map((m) => ({
      id: String(m.id),
      values: {
        fileName: m.fileName,
        type: m.fileType,
        size: formatFileSize(Number(m.fileSize)),
        url: m.fileUrl,
        createdAt: m.createdAt.toISOString().split("T")[0],
      },
    }));

    return ok({ rows, total, page, pageSize });
  } catch (error) {
    console.error("Media GET error:", error);
    return ok({ rows: [], total: 0, page: 1, pageSize: 20 });
  }
}

/** POST /api/admin/media - 上传图片文件 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }

  if (!verifySameOrigin(request)) {
    return forbidden("来源校验失败");
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return badRequest("请选择文件上传");
    }

    if (file.size > MAX_FILE_SIZE) {
      return payloadTooLarge("文件大小不能超过 10 MB");
    }

    const ext = extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return badRequest("仅支持 jpg/jpeg/png/webp/gif 图片");
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return badRequest("文件类型不合法");
    }

    // 磁盘文件名一律用随机 UUID，杜绝路径穿越与文件名冲突；
    // 原始文件名仅做 basename 后存库用于展示。
    const storedName = `${randomUUID()}${ext}`;
    const urlPath = `/uploads/${storedName}`;
    const uploadDir = join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, storedName), buffer);

    const mediaFile = await prisma.mediaFile.create({
      data: {
        fileName: basename(file.name),
        fileUrl: urlPath,
        fileType: file.type,
        fileSize: BigInt(file.size),
      },
    });

    return ok(mediaFile, "上传成功");
  } catch (error) {
    console.error("Media POST error:", error);
    return badRequest("上传失败");
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
