import { AdminResourcePage } from "@/modules/admin/admin-resource-page";
import { requireAdmin } from "@/lib/auth/session";

const columns = [
  { key: "fileName", label: "文件名" },
  { key: "type", label: "类型" },
  { key: "size", label: "大小" },
  { key: "url", label: "访问地址" },
  { key: "createdAt", label: "上传时间" },
];

const rows = [
  {
    id: "media-1",
    values: {
      fileName: "hero-cover.png",
      type: "image/png",
      size: "420 KB",
      url: "/uploads/hero-cover.png",
      createdAt: "2026-04-11 15:30",
    },
  },
  {
    id: "media-2",
    values: {
      fileName: "project-card-blog.webp",
      type: "image/webp",
      size: "180 KB",
      url: "/uploads/project-card.webp",
      createdAt: "2026-04-10 14:20",
    },
  },
  {
    id: "media-3",
    values: {
      fileName: "avatar-default.jpg",
      type: "image/jpeg",
      size: "56 KB",
      url: "/uploads/avatar.jpg",
      createdAt: "2026-04-09 10:00",
    },
  },
  {
    id: "media-4",
    values: {
      fileName: "og-image-home.png",
      type: "image/png",
      size: "256 KB",
      url: "/uploads/og-image.png",
      createdAt: "2026-04-08 09:45",
    },
  },
  {
    id: "media-5",
    values: {
      fileName: "doc-spec.pdf",
      type: "application/pdf",
      size: "1.2 MB",
      url: "/uploads/doc-spec.pdf",
      createdAt: "2026-04-05 16:10",
    },
  },
  {
    id: "media-6",
    values: {
      fileName: "favicon.ico",
      type: "image/x-icon",
      size: "25 KB",
      url: "/favicon.ico",
      createdAt: "2026-04-01 11:30",
    },
  },
];

export default async function AdminMediaPage() {
  await requireAdmin();

  return (
    <AdminResourcePage
      title="媒体资源管理"
      description="管理和预览上传的图片、文档等媒体文件。支持拖拽上传和批量操作。"
      columns={columns}
      rows={rows}
      placeholderNote="上传功能待接入对象存储或本地文件系统。当前仅做列表占位。"
      createLabel="上传文件"
    />
  );
}
