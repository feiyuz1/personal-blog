import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AdminMediaPage as AdminMediaClient } from "@/modules/admin/admin-media-page";

// 文件大小格式化（与媒体 API 保持一致）
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const PAGE_SIZE = 20;

/**
 * 媒体资源管理页（服务端组件）。
 * 在服务端预取第一页数据传入客户端组件，避免首屏空白；
 * 后续翻页、上传、删除由客户端组件自行请求 API。
 */
export default async function AdminMediaPage() {
  await requireAdmin();

  // 首屏只展示第一页
  const [list, total] = await Promise.all([
    prisma.mediaFile.findMany({
      take: PAGE_SIZE,
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

  return (
    <AdminMediaClient
      initialRows={rows}
      initialTotal={total}
      initialPage={1}
      pageSize={PAGE_SIZE}
    />
  );
}
