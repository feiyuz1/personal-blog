"use client";

import { useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Panel } from "@/components/ui/panel";

// 分类行结构
interface CategoryRow {
  id: string;
  values: { name: string; slug: string; description: string; count: string };
}
// 标签行结构
interface TagRow {
  id: string;
  values: { name: string; slug: string; count: string };
}

// 当前激活的 tab：分类 or 标签
type TabKey = "category" | "tag";

/**
 * 分类与标签管理页（客户端组件）。
 *
 * 职责：
 *  - 两个 tab 切换：分类、标签；
 *  - 新增：分类填 name/slug/description，标签填 name/slug；
 *  - 编辑：分类可改 name/description（slug 不改），标签可改 name；
 *  - 删除：关联文章数 >0 时禁用并提示，=0 时确认后删除；
 *  - 操作后自动刷新对应列表。
 */
export function AdminCategoriesPage({
  initialCategories,
  initialTags,
}: {
  initialCategories: CategoryRow[];
  initialTags: TagRow[];
}) {
  const [tab, setTab] = useState<TabKey>("category");
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);
  const [tags, setTags] = useState<TagRow[]>(initialTags);

  // 新增表单状态
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // 编辑状态：null 表示未在编辑，否则为正在编辑的 id
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  // 拉取分类列表
  async function reloadCategories() {
    const res = await fetch("/api/admin/categories");
    const json = (await res.json()) as { code: number; data?: CategoryRow[] };
    if (json.code === 0 && json.data) setCategories(json.data);
  }

  // 拉取标签列表
  async function reloadTags() {
    const res = await fetch("/api/admin/tags");
    const json = (await res.json()) as { code: number; data?: TagRow[] };
    if (json.code === 0 && json.data) setTags(json.data);
  }

  // 新增分类
  async function handleCreateCategory() {
    clearMessages();
    if (!newName.trim() || !newSlug.trim()) {
      setError("名称和 slug 不能为空");
      return;
    }
    setActingId("new");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim(),
          description: newDescription.trim(),
        }),
      });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setError(json.message ?? "创建失败");
      } else {
        setSuccess("分类已创建");
        setNewName("");
        setNewSlug("");
        setNewDescription("");
        await reloadCategories();
      }
    } catch {
      setError("网络错误，创建失败");
    } finally {
      setActingId(null);
    }
  }

  // 新增标签
  async function handleCreateTag() {
    clearMessages();
    if (!newName.trim() || !newSlug.trim()) {
      setError("名称和 slug 不能为空");
      return;
    }
    setActingId("new");
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim() }),
      });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setError(json.message ?? "创建失败");
      } else {
        setSuccess("标签已创建");
        setNewName("");
        setNewSlug("");
        await reloadTags();
      }
    } catch {
      setError("网络错误，创建失败");
    } finally {
      setActingId(null);
    }
  }

  // 进入编辑模式
  function startEditCategory(row: CategoryRow) {
    setEditingId(row.id);
    setEditName(row.values.name);
    setEditDescription(row.values.description);
    clearMessages();
  }
  function startEditTag(row: TagRow) {
    setEditingId(row.id);
    setEditName(row.values.name);
    clearMessages();
  }

  // 提交编辑分类
  async function handleUpdateCategory(id: string) {
    clearMessages();
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() }),
      });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setError(json.message ?? "更新失败");
      } else {
        setSuccess("已更新");
        setEditingId(null);
        await reloadCategories();
      }
    } catch {
      setError("网络错误，更新失败");
    } finally {
      setActingId(null);
    }
  }

  // 提交编辑标签
  async function handleUpdateTag(id: string) {
    clearMessages();
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setError(json.message ?? "更新失败");
      } else {
        setSuccess("已更新");
        setEditingId(null);
        await reloadTags();
      }
    } catch {
      setError("网络错误，更新失败");
    } finally {
      setActingId(null);
    }
  }

  // 删除分类
  async function handleDeleteCategory(id: string, count: string) {
    clearMessages();
    if (Number(count) > 0) {
      setError(`该分类下有 ${count} 篇文章，请先迁移后再删除`);
      return;
    }
    if (!confirm("确定删除该分类吗？")) return;
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setError(json.message ?? "删除失败");
      } else {
        setSuccess("已删除");
        await reloadCategories();
      }
    } catch {
      setError("网络错误，删除失败");
    } finally {
      setActingId(null);
    }
  }

  // 删除标签
  async function handleDeleteTag(id: string, count: string) {
    clearMessages();
    if (Number(count) > 0) {
      setError(`该标签被 ${count} 篇文章引用，请先取消关联后再删除`);
      return;
    }
    if (!confirm("确定删除该标签吗？")) return;
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setError(json.message ?? "删除失败");
      } else {
        setSuccess("已删除");
        await reloadTags();
      }
    } catch {
      setError("网络错误，删除失败");
    } finally {
      setActingId(null);
    }
  }

  return (
    <AdminShell
      title="分类与标签管理"
      description="管理博客的分类体系与标签体系。分类偏栏目组织，标签偏主题索引。删除前需确保无文章关联。"
    >
      {/* Tab 切换 */}
      <div className="flex items-center gap-2">
        {([
          { key: "category", label: `分类（${categories.length}）` },
          { key: "tag", label: `标签（${tags.length}）` },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              setEditingId(null);
              clearMessages();
              // 切 tab 时清空新增表单
              setNewName("");
              setNewSlug("");
              setNewDescription("");
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t.key
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 消息提示 */}
      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {/* 新增表单 */}
      <Panel title={tab === "category" ? "新增分类" : "新增标签"}>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">名称 *</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={tab === "category" ? "如：技术开发" : "如：Unreal Engine"}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Slug *（URL 标识，小写字母/数字/短横线）</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="如：tech 或 unreal-engine"
            />
          </label>
          {tab === "category" ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">描述（可选）</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </label>
          ) : null}
        </div>
        <div className="mt-4">
          <button
            type="button"
            disabled={actingId === "new"}
            onClick={tab === "category" ? handleCreateCategory : handleCreateTag}
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {actingId === "new" ? "提交中..." : `+ 新增${tab === "category" ? "分类" : "标签"}`}
          </button>
        </div>
      </Panel>

      {/* 列表 */}
      {tab === "category" ? (
        <Panel title="分类列表" description="已创建的分类。slug 创建后不可修改。">
          {categories.length > 0 ? (
            <div className="overflow-hidden rounded-3xl border border-black/5">
              <table className="min-w-full divide-y divide-black/5 bg-white">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">名称</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Slug</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">描述</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">文章数</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {categories.map((row) => (
                    <tr key={row.id} className="transition hover:bg-slate-50/50">
                      {editingId === row.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">{row.values.slug}</td>
                          <td className="px-4 py-3">
                            <input
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{row.values.count}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              disabled={actingId === row.id}
                              onClick={() => handleUpdateCategory(row.id)}
                              className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                            >
                              保存
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="ml-2 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              取消
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">{row.values.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{row.values.slug}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{row.values.description || "-"}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{row.values.count}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => startEditCategory(row)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              disabled={actingId === row.id}
                              onClick={() => handleDeleteCategory(row.id, row.values.count)}
                              className="ml-2 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              删除
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-400">
              暂无分类。
            </div>
          )}
        </Panel>
      ) : (
        <Panel title="标签列表" description="已创建的标签。slug 创建后不可修改。">
          {tags.length > 0 ? (
            <div className="overflow-hidden rounded-3xl border border-black/5">
              <table className="min-w-full divide-y divide-black/5 bg-white">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">名称</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Slug</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">文章数</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {tags.map((row) => (
                    <tr key={row.id} className="transition hover:bg-slate-50/50">
                      {editingId === row.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">{row.values.slug}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{row.values.count}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              disabled={actingId === row.id}
                              onClick={() => handleUpdateTag(row.id)}
                              className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                            >
                              保存
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="ml-2 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              取消
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">{row.values.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{row.values.slug}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{row.values.count}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => startEditTag(row)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              disabled={actingId === row.id}
                              onClick={() => handleDeleteTag(row.id, row.values.count)}
                              className="ml-2 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              删除
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-400">
              暂无标签。
            </div>
          )}
        </Panel>
      )}
    </AdminShell>
  );
}
