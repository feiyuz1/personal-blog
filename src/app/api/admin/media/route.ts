import { ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

/** GET /api/admin/media - 分页获取媒体文件列表 */
export async function GET(request: Request) {
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

/** POST /api/admin/media - 上传文件（占位实现，元数据存入数据库） */
export async function POST(request: Request) {
  try {
    // TODO: 实现真正的文件上传处理
    // 目前接收 FormData 并保存元数据
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return ok(null, "请选择文件上传");
    }

    // 生成模拟的 URL 路径
    const fileName = file.name || "unknown";
    const urlPath = `/uploads/${Date.now()}-${fileName}`;
    const uploadDir = join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, `${Date.now()}-${fileName}`), buffer);

    const mediaFile = await prisma.mediaFile.create({
      data: {
        fileName,
        fileUrl: urlPath,
        fileType: file.type || "application/octet-stream",
        fileSize: BigInt(file.size),
      },
    });

    return ok(mediaFile, "上传成功");
  } catch (error) {
    console.error("Media POST error:", error);
    return ok(null, "上传失败");
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
