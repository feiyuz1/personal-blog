"use client";

/* 封面可能来自媒体库或管理员填写的受校验外部地址。 */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Panel } from "@/components/ui/panel";
import type { AdminProjectRecord } from "@/services/admin-service";
import type { ApiResponse } from "@/types/api";

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
}

interface ProjectListResponse {
  list: AdminProjectRecord[];
  total: number;
}

type ProjectForm = Omit<AdminProjectRecord, "id">;

const emptyForm: ProjectForm = {
  name: "",
  slug: "",
  summary: "",
  coverUrl: "",
  techStack: [],
  status: "PLANNING",
  role: "",
  highlights: [],
  milestones: [],
  articleSlug: "",
  githubUrl: "",
  projectUrl: "",
  sortOrder: 0,
};

const statusLabel: Record<ProjectForm["status"], string> = {
  PLANNING: "规划中",
  BUILDING: "开发中",
  ONLINE: "已上线",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none";

function isVideoUrl(url: string) {
  return /\.(mp4|webm)(?:[?#].*)?$/i.test(url);
}

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminProjectsPage({
  initialProjects,
  initialTotal,
}: {
  initialProjects: AdminProjectRecord[];
  initialTotal: number;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [total, setTotal] = useState(initialTotal);
  const [mediaRows, setMediaRows] = useState<MediaRow[]>([]);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const editing = editingId !== null;
  const orderedMedia = useMemo(
    () =>
      mediaRows.filter(
        (row) =>
          row.values.type.startsWith("image/") ||
          row.values.type.startsWith("video/"),
      ),
    [mediaRows],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/media?page=1&pageSize=100")
      .then((response) => response.json())
      .then((data: ApiResponse<MediaListResponse>) => {
        if (!cancelled && data.code === 0 && Array.isArray(data.data?.rows)) {
          setMediaRows(data.data.rows);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  async function reloadProjects() {
    const response = await fetch("/api/admin/projects?page=1&pageSize=100");
    const data = (await response.json()) as ApiResponse<ProjectListResponse>;
    if (data.code !== 0 || !data.data) {
      throw new Error(data.message ?? "加载项目失败");
    }
    setProjects(data.data.list);
    setTotal(data.data.total);
  }

  function startCreate() {
    setEditingId("new");
    setForm({ ...emptyForm });
    setMessage(null);
  }

  function startEdit(project: AdminProjectRecord) {
    const { id, ...nextForm } = project;
    setEditingId(id);
    setForm({ ...nextForm });
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setMessage(null);
  }

  function updateField<K extends keyof ProjectForm>(
    field: K,
    value: ProjectForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      setMessage({ type: "error", text: "项目名称和 URL Slug 不能为空" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim(),
        summary: form.summary.trim(),
        coverUrl: form.coverUrl.trim(),
        role: form.role.trim(),
        articleSlug: form.articleSlug.trim(),
        githubUrl: form.githubUrl.trim(),
        projectUrl: form.projectUrl.trim(),
      };
      const isNew = editingId === "new";
      const response = await fetch(
        isNew ? "/api/admin/projects" : `/api/admin/projects/${editingId}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as ApiResponse<unknown>;
      if (!response.ok || data.code !== 0) {
        throw new Error(data.message ?? "保存失败");
      }

      await reloadProjects();
      setMessage({
        type: "success",
        text: isNew ? "项目已创建" : "项目已更新",
      });
      setEditingId(null);
      setForm({ ...emptyForm });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "网络错误，保存失败",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(id: string) {
    if (!confirm("确定删除这个项目吗？项目引用的媒体文件不会被删除。")) return;
    setDeletingId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as ApiResponse<unknown>;
      if (!response.ok || data.code !== 0) {
        throw new Error(data.message ?? "删除失败");
      }
      await reloadProjects();
      setMessage({ type: "success", text: "项目已删除" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "网络错误，删除失败",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminShell
      title="项目管理"
      description="维护项目卡片、图片或视频封面、技术栈与详情内容。封面可从媒体库选择，也可填写可信的外部地址。"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">共 {total} 个项目</p>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          + 新建项目
        </button>
      </div>

      {message ? (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {editing ? (
        <Panel
          title={editingId === "new" ? "新建项目" : "编辑项目"}
          description="卡片上方优先展示封面图片或视频；视频将在前台放大后显示播放控件。"
        >
          <form onSubmit={saveProject} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  项目名称 *
                </span>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  onBlur={() => {
                    if (!form.slug)
                      updateField("slug", generateSlug(form.name));
                  }}
                  placeholder="例如：UE 渲染实验"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  URL Slug *
                </span>
                <input
                  className={`${inputClass} font-mono`}
                  value={form.slug}
                  onChange={(event) => updateField("slug", event.target.value)}
                  placeholder="ue-rendering-lab"
                  required
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                简要介绍
              </span>
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={form.summary}
                onChange={(event) => updateField("summary", event.target.value)}
                placeholder="显示在项目卡片底部的简短说明。"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
              <div className="space-y-3">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    从媒体库选择封面
                  </span>
                  <select
                    className={inputClass}
                    value={form.coverUrl}
                    onChange={(event) =>
                      updateField("coverUrl", event.target.value)
                    }
                  >
                    <option value="">不使用封面</option>
                    {orderedMedia.map((media) => (
                      <option key={media.id} value={media.values.url}>
                        {media.values.type.startsWith("video/")
                          ? "视频"
                          : "图片"}{" "}
                        · {media.values.fileName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    或填写封面地址
                  </span>
                  <input
                    className={inputClass}
                    value={form.coverUrl}
                    onChange={(event) =>
                      updateField("coverUrl", event.target.value)
                    }
                    placeholder="/uploads/example.mp4 或 https://..."
                  />
                </label>
                <p className="text-xs leading-5 text-slate-500">
                  可选 mp4/webm 视频或图片。媒体库文件请先在「媒体资源」上传。
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-950">
                {form.coverUrl ? (
                  isVideoUrl(form.coverUrl) ? (
                    <video
                      src={form.coverUrl}
                      className="aspect-video h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={form.coverUrl}
                      alt="项目封面预览"
                      className="aspect-video h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-slate-400">
                    项目封面预览
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  项目状态
                </span>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value as ProjectForm["status"],
                    )
                  }
                >
                  <option value="PLANNING">规划中</option>
                  <option value="BUILDING">开发中</option>
                  <option value="ONLINE">已上线</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  我的角色
                </span>
                <input
                  className={inputClass}
                  value={form.role}
                  onChange={(event) => updateField("role", event.target.value)}
                  placeholder="开发、图形程序员..."
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">排序</span>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateField("sortOrder", Number(event.target.value))
                  }
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">技术栈</span>
              <input
                className={inputClass}
                value={form.techStack.join(", ")}
                onChange={(event) =>
                  updateField(
                    "techStack",
                    event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="C++, Unreal Engine, DirectX 12"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  项目亮点（每行一条）
                </span>
                <textarea
                  className={`${inputClass} min-h-32 resize-y`}
                  value={form.highlights.join("\n")}
                  onChange={(event) =>
                    updateField("highlights", toLines(event.target.value))
                  }
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  里程碑（每行一条）
                </span>
                <textarea
                  className={`${inputClass} min-h-32 resize-y`}
                  value={form.milestones.join("\n")}
                  onChange={(event) =>
                    updateField("milestones", toLines(event.target.value))
                  }
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  关联文章 Slug
                </span>
                <input
                  className={inputClass}
                  value={form.articleSlug}
                  onChange={(event) =>
                    updateField("articleSlug", event.target.value)
                  }
                  placeholder="post-slug"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  GitHub 地址
                </span>
                <input
                  className={inputClass}
                  type="url"
                  value={form.githubUrl}
                  onChange={(event) =>
                    updateField("githubUrl", event.target.value)
                  }
                  placeholder="https://github.com/..."
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  在线预览地址
                </span>
                <input
                  className={inputClass}
                  type="url"
                  value={form.projectUrl}
                  onChange={(event) =>
                    updateField("projectUrl", event.target.value)
                  }
                  placeholder="https://..."
                />
              </label>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存项目"}
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel
        title="项目列表"
        description="项目会按“排序”从小到大显示在前台项目页。"
      >
        {projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
              >
                <div className="flex h-28 items-center gap-4 bg-slate-950 p-3">
                  {project.coverUrl ? (
                    isVideoUrl(project.coverUrl) ? (
                      <video
                        src={project.coverUrl}
                        className="h-full w-36 rounded-xl object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={project.coverUrl}
                        alt=""
                        className="h-full w-36 rounded-xl object-cover"
                      />
                    )
                  ) : (
                    <div className="flex h-full w-36 items-center justify-center rounded-xl bg-white/10 text-xs text-slate-400">
                      未设置封面
                    </div>
                  )}
                  <div className="min-w-0 text-slate-50">
                    <p className="truncate text-base font-semibold">
                      {project.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {statusLabel[project.status]} · 排序 {project.sortOrder}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
                    {project.summary || "暂未填写简要介绍。"}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/projects/${project.slug}`}
                      target="_blank"
                      className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                      预览前台
                    </Link>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(project)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === project.id}
                        onClick={() => removeProject(project.id)}
                        className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === project.id ? "删除中..." : "删除"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
            暂无项目，点击“新建项目”添加第一个作品。
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
