"use client";

import { useState, useRef } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Panel } from "@/components/ui/panel";

// 媒体列表行结构（与 GET /api/admin/media 返回的 rows 一致）
interface MediaRow {
  id: string;
  values: {
    fileName: string;
    type: string;
    size: string;
    url: string;
    createdAt: string;
  };
}

interface MediaListResponse {
  rows: MediaRow[];
  total: number;
  page: number;
  pageSize: number;
}

const COLUMNS: Array<{ key: keyof MediaRow["values"]; label: string }> = [
  { key: "fileName", label: "文件名" },
  { key: "type", label: "类型" },
  { key: "size", label: "大小" },
  { key: "url", label: "访问地址" },
  { key: "createdAt", label: "上传时间" },
];

/**
 * 媒体资源管理页（客户端组件）。
 *
 * 职责：
 *  - 首屏由服务端预取数据传入，避免空白闪烁；
 *  - 上传：选择图片或项目演示视频后通过 FormData 提交到 POST /api/admin/media；
 *  - 删除：调用 DELETE /api/admin/media/[id]，同步清理磁盘与数据库；
 *  - 分页：上一页 / 下一页切换时重新拉取列表。
 */
export function AdminMediaPage({
  initialRows,
  initialTotal,
  initialPage,
  pageSize,
}: {
  initialRows: MediaRow[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
}) {
  // 列表数据与分页状态
  const [rows, setRows] = useState<MediaRow[]>(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);

  // 交互态：上传中、重命名/删除中、错误提示
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 拉取指定页码的媒体列表
  async function loadPage(targetPage: number) {
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/media?page=${targetPage}&pageSize=${pageSize}`,
      );
      const json = (await res.json()) as {
        code: number;
        data: MediaListResponse;
        message?: string;
      };
      if (json.code === 0 && json.data) {
        setRows(json.data.rows);
        setTotal(json.data.total);
        setPage(json.data.page);
      } else {
        setError(json.message ?? "加载失败");
      }
    } catch {
      setError("网络错误，无法加载列表");
    }
  }

  // 处理文件上传
  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setError(json.message ?? "上传失败");
      } else {
        // 上传成功后回到第一页，确保新文件可见
        await loadPage(1);
      }
    } catch {
      setError("网络错误，上传失败");
    } finally {
      setUploading(false);
      // 清空 input，便于再次选择同一文件
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // 处理删除
  async function handleDelete(id: string) {
    if (!confirm("确定删除该媒体文件吗？磁盘文件也会一并删除。")) return;
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setError(json.message ?? "删除失败");
      } else {
        // 删除后若当前页已空，回退一页
        const remaining = rows.length - 1;
        const targetPage = remaining === 0 && page > 1 ? page - 1 : page;
        await loadPage(targetPage);
      }
    } catch {
      setError("网络错误，删除失败");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRename(row: MediaRow) {
    const fileName = prompt(
      "输入新的展示文件名（不会改变图片访问地址）",
      row.values.fileName,
    )?.trim();
    if (fileName === undefined || fileName === row.values.fileName) return;
    if (!fileName) {
      setError("文件名不能为空");
      return;
    }

    setError(null);
    setRenamingId(row.id);
    try {
      const res = await fetch(`/api/admin/media/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName }),
      });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setError(json.message ?? "重命名失败");
      } else {
        setRows((current) =>
          current.map((item) =>
            item.id === row.id
              ? { ...item, values: { ...item.values, fileName } }
              : item,
          ),
        );
      }
    } catch {
      setError("网络错误，重命名失败");
    } finally {
      setRenamingId(null);
    }
  }

  // 分页计算
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <AdminShell
      title="媒体资源管理"
      description="上传、预览和删除图片或项目演示视频。当前文件存储在本地 public/uploads 目录，后续可切换到对象存储。"
    >
      {/* 操作栏：上传 + 统计 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {uploading ? "上传中..." : "+ 上传文件"}
          </button>
          <span className="text-xs text-slate-400">
            共 {total} 条记录 · 图片 ≤ 30MB，mp4/webm 视频 ≤ 100MB
          </span>
        </div>
      </div>

      {/* 错误提示 */}
      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {/* 数据列表 */}
      <Panel title="媒体列表" description="已上传的媒体文件。">
        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-black/5">
            <table className="min-w-full divide-y divide-black/5 bg-white">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    预览
                  </th>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left text-sm font-semibold text-slate-700"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <a
                        href={row.values.url}
                        target="_blank"
                        rel="noreferrer"
                        title="查看媒体文件"
                      >
                        {row.values.type.startsWith("video/") ? (
                          <video
                            src={row.values.url}
                            className="h-12 w-16 rounded-lg border border-slate-100 object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={row.values.url}
                            alt={row.values.fileName}
                            className="h-12 w-16 rounded-lg border border-slate-100 object-cover"
                          />
                        )}
                      </a>
                    </td>
                    {COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        className="px-4 py-3 text-sm text-slate-600"
                      >
                        {column.key === "url" ? (
                          <a
                            href={row.values.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 underline-offset-2 hover:underline"
                          >
                            {row.values.url}
                          </a>
                        ) : (
                          (row.values[column.key] ?? "-")
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={
                            renamingId === row.id || deletingId === row.id
                          }
                          onClick={() => handleRename(row)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          {renamingId === row.id ? "保存中..." : "改名"}
                        </button>
                        <button
                          type="button"
                          disabled={
                            deletingId === row.id || renamingId === row.id
                          }
                          onClick={() => handleDelete(row.id)}
                          className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === row.id ? "删除中..." : "删除"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-400">
            暂无媒体文件，点击左上角“上传文件”添加。
          </div>
        )}
      </Panel>

      {/* 分页 */}
      {total > 0 ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 p-4">
          <p className="text-xs text-slate-400">
            显示 {rangeStart}-{rangeEnd} 条，共 {total} 条
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => loadPage(page - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              &lt; 上一页
            </button>
            <span className="px-2 text-xs text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => loadPage(page + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              下一页 &gt;
            </button>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
