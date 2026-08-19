"use client";

import { useState } from "react";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { Panel } from "@/components/ui/panel";

// 文章列表行结构（与 GET /api/admin/posts 返回一致）
interface PostRow {
  id: string;
  values: {
    title: string;
    status: string;
    category: string;
    updatedAt: string;
  };
}

interface PostListResponse {
  rows: PostRow[];
  total: number;
  page: number;
  pageSize: number;
}

const COLUMNS: Array<{ key: keyof PostRow["values"]; label: string }> = [
  { key: "title", label: "标题" },
  { key: "status", label: "状态" },
  { key: "category", label: "分类" },
  { key: "updatedAt", label: "更新时间" },
];

// 状态筛选 tab：value 对应 API 的 status 参数
const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: "全部", value: "" },
  { label: "草稿", value: "DRAFT" },
  { label: "已发布", value: "PUBLISHED" },
  { label: "已下线", value: "OFFLINE" },
];

/**
 * 文章管理页（客户端组件）。
 *
 * 职责：
 *  - 按状态 tab 切换筛选；
 *  - 按标题关键词搜索（输入回车触发）；
 *  - 分页翻页；
 *  - 删除文章（带确认）；
 *  - 编辑跳转到 /admin/posts?action=edit&id=xxx。
 *
 * 首屏数据由服务端组件预取传入，避免 useEffect 拉取闪烁。
 */
export function AdminPostsPage({
  initialRows,
  initialTotal,
  initialPage,
  pageSize,
  initialStatus,
  initialKeyword,
}: {
  initialRows: PostRow[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  initialStatus: string;
  initialKeyword: string;
}) {
  const [rows, setRows] = useState<PostRow[]>(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState(initialStatus);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 拉取指定条件下的文章列表
  async function loadPage(targetPage: number, targetStatus: string, targetKeyword: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
      });
      if (targetStatus) params.set("status", targetStatus);
      if (targetKeyword) params.set("keyword", targetKeyword);

      const res = await fetch(`/api/admin/posts?${params.toString()}`);
      const json = (await res.json()) as { code: number; data: PostListResponse; message?: string };
      if (json.code === 0 && json.data) {
        setRows(json.data.rows);
        setTotal(json.data.total);
        setPage(json.data.page);
      } else {
        setError(json.message ?? "加载失败");
      }
    } catch {
      setError("网络错误，无法加载列表");
    } finally {
      setLoading(false);
    }
  }

  // 切换状态 tab：回到第一页
  function handleTabChange(targetStatus: string) {
    setStatus(targetStatus);
    loadPage(1, targetStatus, keyword);
  }

  // 搜索：回车触发
  function handleSearch(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      setPage(1);
      loadPage(1, status, keyword);
    }
  }

  // 删除文章
  async function handleDelete(id: string) {
    if (!confirm("确定要删除这篇文章吗？此操作不可撤销。")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setError(json.message ?? "删除失败");
      } else {
        // 删除后若当前页删空则回退一页
        const remaining = rows.length - 1;
        const targetPage = remaining === 0 && page > 1 ? page - 1 : page;
        await loadPage(targetPage, status, keyword);
      }
    } catch {
      setError("网络错误，删除失败");
    }
  }

  // 分页计算
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  // 状态对应颜色
  const statusColor: Record<string, string> = {
    草稿: "text-slate-500",
    "已发布": "text-emerald-600",
    "已发布(置顶)": "text-emerald-700 font-semibold",
    "已下线": "text-rose-600",
  };

  return (
    <AdminShell
      title="文章管理"
      description="管理所有博客文章。支持创建、编辑、发布、删除，并按状态与关键词筛选。"
    >
      {/* 操作栏：新建 + 状态 tab + 搜索 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts?action=new"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + 新建文章
          </Link>
          <span className="text-xs text-slate-400">共 {total} 条记录</span>
        </div>
        <input
          type="search"
          placeholder="搜索标题，回车触发..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleSearch}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
        />
      </div>

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

      {/* 文章表格 */}
      <Panel title="文章列表">
        {!loading && rows.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-black/5">
            <table className="min-w-full divide-y divide-black/5 bg-white">
              <thead className="bg-slate-50">
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-sm font-semibold text-slate-700"
                    >
                      {col.label}
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
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-sm text-slate-600"
                      >
                        {col.key === "status" ? (
                          <span className={statusColor[row.values.status] ?? "text-slate-600"}>
                            {row.values.status}
                          </span>
                        ) : (
                          row.values[col.key]
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/posts?action=edit&id=${row.id}`}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          编辑
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-sm text-slate-400">正在加载...</div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-400">
            暂无文章，点击左上角「新建文章」开始创建。
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
              disabled={!canPrev || loading}
              onClick={() => loadPage(page - 1, status, keyword)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              &lt; 上一页
            </button>
            <span className="px-2 text-xs text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={!canNext || loading}
              onClick={() => loadPage(page + 1, status, keyword)}
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
