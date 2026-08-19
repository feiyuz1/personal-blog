"use client";

import { useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Panel } from "@/components/ui/panel";

// 评论列表行结构（与 GET /api/admin/comments 返回一致）
interface CommentRow {
  id: string;
  values: {
    author: string;
    email: string;
    postTitle: string;
    excerpt: string;
    status: string;
    createdAt: string;
  };
}

interface CommentListResponse {
  rows: CommentRow[];
  total: number;
  page: number;
  pageSize: number;
}

const COLUMNS: Array<{ key: keyof CommentRow["values"]; label: string }> = [
  { key: "author", label: "评论人" },
  { key: "email", label: "邮箱" },
  { key: "postTitle", label: "文章" },
  { key: "excerpt", label: "内容摘要" },
  { key: "status", label: "状态" },
  { key: "createdAt", label: "提交时间" },
];

// 状态筛选 tab：value 对应 API 的 status 参数
const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: "待审核", value: "PENDING" },
  { label: "已通过", value: "APPROVED" },
  { label: "已拒绝", value: "REJECTED" },
  { label: "全部", value: "all" },
];

type ReviewAction = "approve" | "reject" | "delete";

/**
 * 评论审核页（客户端组件）。
 *
 * 职责：
 *  - 按状态 tab 切换筛选（默认待审核）；
 *  - 对每条评论执行 通过 / 拒绝 / 删除 操作，调用 PUT /api/admin/comments/[id]/review；
 *  - 分页翻页；
 *  - 操作后自动刷新当前列表。
 */
export function AdminCommentsPage({
  initialRows,
  initialTotal,
  initialPage,
  pageSize,
  initialStatus,
}: {
  initialRows: CommentRow[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  initialStatus: string;
}) {
  const [rows, setRows] = useState<CommentRow[]>(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState(initialStatus);

  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 拉取指定状态与页码的评论列表
  async function loadPage(targetPage: number, targetStatus: string) {
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/comments?page=${targetPage}&pageSize=${pageSize}&status=${targetStatus}`,
      );
      const json = (await res.json()) as { code: number; data: CommentListResponse; message?: string };
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

  // 切换状态 tab：回到第一页并按新状态加载
  function handleTabChange(targetStatus: string) {
    setStatus(targetStatus);
    loadPage(1, targetStatus);
  }

  // 执行审核操作
  async function handleAction(id: string, action: ReviewAction) {
    const confirmMap: Record<ReviewAction, string> = {
      approve: "确定通过该评论吗？",
      reject: "确定拒绝该评论吗？",
      delete: "确定删除该评论吗？此操作不可恢复。",
    };
    if (!confirm(confirmMap[action])) return;

    setError(null);
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setError(json.message ?? "操作失败");
      } else {
        // 操作成功后刷新当前列表；若当前页删空则回退一页
        const remaining = rows.length - 1;
        const targetPage = remaining === 0 && page > 1 ? page - 1 : page;
        await loadPage(targetPage, status);
      }
    } catch {
      setError("网络错误，操作失败");
    } finally {
      setActingId(null);
    }
  }

  // 分页计算
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  // 状态对应的按钮颜色
  const statusColor: Record<string, string> = {
    待审核: "text-amber-600",
    已通过: "text-emerald-600",
    已拒绝: "text-rose-600",
  };

  return (
    <AdminShell
      title="评论审核"
      description="审核用户提交的评论：通过、拒绝或删除。默认展示待审核队列。"
    >
      {/* 状态筛选 tab */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabChange(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              status === tab.value
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 错误提示 */}
      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {/* 评论列表 */}
      <Panel title="评论列表" description={`当前筛选：${STATUS_TABS.find((t) => t.value === status)?.label ?? ""}`}>
        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-black/5">
            <table className="min-w-full divide-y divide-black/5 bg-white">
              <thead className="bg-slate-50">
                <tr>
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
                    {COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        className="px-4 py-3 text-sm text-slate-600"
                      >
                        {column.key === "status" ? (
                          <span className={`font-medium ${statusColor[row.values.status] ?? "text-slate-600"}`}>
                            {row.values.status}
                          </span>
                        ) : (
                          (row.values[column.key] ?? "-")
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={actingId === row.id}
                          onClick={() => handleAction(row.id, "approve")}
                          className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          通过
                        </button>
                        <button
                          type="button"
                          disabled={actingId === row.id}
                          onClick={() => handleAction(row.id, "reject")}
                          className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                        >
                          拒绝
                        </button>
                        <button
                          type="button"
                          disabled={actingId === row.id}
                          onClick={() => handleAction(row.id, "delete")}
                          className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {actingId === row.id ? "处理中..." : "删除"}
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
            暂无评论。
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
              onClick={() => loadPage(page - 1, status)}
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
              onClick={() => loadPage(page + 1, status)}
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
