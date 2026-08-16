"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { Panel } from "@/components/ui/panel";
import { NotImplemented } from "@/components/ui/not-implemented";

interface PostRow {
  id: string;
  values: Record<string, string>;
}

export function AdminPostsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 从 API 加载文章列表
  useEffect(() => {
    fetch("/api/admin/posts")
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 0 && data.data?.rows) {
          setRows(data.data.rows);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "title", label: "标题" },
    { key: "status", label: "状态" },
    { key: "category", label: "分类" },
    { key: "updatedAt", label: "更新时间" },
  ];

  async function handleEdit(id: string) {
    router.push(`/admin/posts?action=edit&id=${id}`);
  }

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这篇文章吗？此操作不可撤销。")) return;

    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.code === 0) {
        setRows((prev) => prev.filter((row) => row.id !== id));
      } else {
        alert(data.message ?? "删除失败");
      }
    } catch {
      alert("网络错误，请重试");
    }
  }

  return (
    <AdminShell
      title="文章管理"
      description="管理所有博客文章。支持创建、编辑、发布和删除操作。"
    >
      {/* 操作栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts?action=new"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition"
          >
            + 新建文章
          </Link>
          <span className="text-xs text-slate-400">共 {rows.length} 条记录</span>
        </div>
        <input
          type="search"
          placeholder="搜索标题..."
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
        />
      </div>

      {/* 文章表格 */}
      <Panel title="文章列表" description={loading ? "加载中..." : rows.length === 0 ? "暂无文章，点击「新建文章」开始创建" : ""}>
        {!loading && rows.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-black/5">
            <table className="min-w-full divide-y divide-black/5 bg-white">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map((col) => (
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
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-sm text-slate-600"
                      >
                        {row.values[col.key]}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(row.id)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
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
          <NotImplemented feature="文章列表" />
        )}
      </Panel>

      {/* 分页占位 */}
      {!loading && rows.length > 0 ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 p-4">
          <p className="text-xs text-slate-400">显示全部 {rows.length} 条</p>
        </div>
      ) : null}
    </AdminShell>
  );
}
