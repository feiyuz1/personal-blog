"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { Panel } from "@/components/ui/panel";
import { NotImplemented } from "@/components/ui/not-implemented";

interface Column {
  key: string;
  label: string;
}

interface Row {
  id: string;
  values: Record<string, string>;
}

export function AdminResourcePage({
  title,
  description,
  columns,
  rows,
  placeholderNote,
  createLabel = "新建",
}: {
  title: string;
  description: string;
  columns: Column[];
  rows: Row[];
  placeholderNote: string;
  createLabel?: string;
}) {
  return (
    <AdminShell title={title} description={description}>
      {/* 操作栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            onClick={() => {
              // TODO: 接入新建/创建逻辑
            }}
          >
            + {createLabel}
          </button>
          <span className="text-xs text-slate-400">
            共 {rows.length} 条记录
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="搜索..."
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
          />
        </div>
      </div>

      {/* 表格 */}
      <Panel title="数据列表" description={placeholderNote}>
        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-black/5">
            <table className="min-w-full divide-y divide-black/5 bg-white">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map((column) => (
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
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="px-4 py-3 text-sm text-slate-600"
                      >
                        {row.values[column.key] ?? "-"}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                          onClick={() => {}}
                        >
                          编辑
                        </button>
                        <button
                          className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100"
                          onClick={() => {}}
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
        ) : (
          <NotImplemented feature={`${title}列表`} />
        )}
      </Panel>

      {/* 分页占位 */}
      {rows.length > 0 ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 p-4">
          <p className="text-xs text-slate-400">
            显示 1-{Math.min(rows.length, 10)} 条，共 {rows.length} 条
          </p>
          <div className="flex gap-1">
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-400" disabled>
              &lt; 上一页
            </button>
            <button className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs text-white">1</button>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600">2</button>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-400">
              下一页 &gt;
            </button>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
