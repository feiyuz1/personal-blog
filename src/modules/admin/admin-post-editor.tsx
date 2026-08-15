"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import type { ApiResponse } from "@/types/api";

interface PostFormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  readingTime: string;
  categoryId: number | "";
  isTop: boolean;
  status: "DRAFT" | "PUBLISHED" | "OFFLINE";
  tagSlugs: string[];
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface TagOption {
  name: string;
  slug: string;
}

interface AdminCategoryRow {
  id: string;
  values: {
    _type: string;
    name: string;
    slug: string;
  };
}

interface PostEditorRecord {
  title: string;
  slug: string;
  summary: string;
  content: string;
  readingTime: string;
  categoryId: string | null;
  isTop: boolean;
  status: "DRAFT" | "PUBLISHED" | "OFFLINE";
  tagSlugs: string[];
}

const defaultForm: PostFormData = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  readingTime: "5 min",
  categoryId: "",
  isTop: false,
  status: "DRAFT",
  tagSlugs: [],
};

export function AdminPostEditorPage({ editId }: { editId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<PostFormData>({ ...defaultForm });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [loaded, setLoaded] = useState(!editId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/categories")
      .then((response) => response.json())
      .then((data: ApiResponse<AdminCategoryRow[]>) => {
        if (cancelled || !Array.isArray(data.data)) return;

        setCategories(
          data.data
            .filter((row) => row.values._type === "分类")
            .map((row) => ({
              id: row.id,
              name: row.values.name,
              slug: row.values.slug,
            })),
        );
      })
      .catch(() => {});

    fetch("/api/tags")
      .then((response) => response.json())
      .then((data: ApiResponse<TagOption[]>) => {
        if (cancelled || !Array.isArray(data.data)) return;
        setTags(data.data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editId) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`/api/admin/posts/${editId}`);
        const data = (await response.json()) as ApiResponse<PostEditorRecord>;

        if (!cancelled && response.ok && data.code === 0 && data.data) {
          const post = data.data;
          setForm({
            title: post.title ?? "",
            slug: post.slug ?? "",
            summary: post.summary ?? "",
            content: post.content ?? "",
            readingTime: post.readingTime ?? "5 min",
            categoryId: post.categoryId ? Number(post.categoryId) : "",
            isTop: Boolean(post.isTop),
            status: post.status ?? "DRAFT",
            tagSlugs: post.tagSlugs ?? [],
          });
        }
      } catch {
        if (!cancelled) {
          setMessage({ type: "error", text: "加载文章失败" });
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editId]);

  const updateField = useCallback(
    <K extends keyof PostFormData>(field: K, value: PostFormData[K]) => {
      setForm((current) => ({ ...current, [field]: value }));
      setMessage(null);
    },
    [],
  );

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/[^\w\u4e00-\u9fff-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleTitleBlur() {
    if (!form.slug) {
      updateField("slug", generateSlug(form.title));
    }
  }

  function toggleTag(tagSlug: string) {
    setForm((current) => ({
      ...current,
      tagSlugs: current.tagSlugs.includes(tagSlug)
        ? current.tagSlugs.filter((slug) => slug !== tagSlug)
        : [...current.tagSlugs, tagSlug],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        slug: form.slug,
        summary: form.summary,
        content: form.content,
        readingTime: form.readingTime,
        isTop: form.isTop,
        status: form.status,
        tagSlugs: form.tagSlugs,
      };

      if (form.categoryId) {
        payload.categoryId = form.categoryId;
      }

      const url = editId ? `/api/admin/posts/${editId}` : "/api/admin/posts";
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok && data.code === 0) {
        setMessage({ type: "success", text: editId ? "文章已更新" : "文章已创建" });
        if (!editId) {
          setTimeout(() => router.push("/admin/posts"), 1000);
        }
      } else {
        setMessage({ type: "error", text: data.message ?? "保存失败" });
      }
    } catch {
      setMessage({ type: "error", text: "网络错误，请重试" });
    } finally {
      setSaving(false);
    }
  }

  const isLoading = Boolean(editId) && !loaded;

  return (
    <AdminShell
      title={editId ? "编辑文章" : "新建文章"}
      description="填写文章标题、内容、分类和标签。当前编辑器使用 Prisma 数据源，后续可以继续补充 MDX 预览。"
    >
      {isLoading ? (
        <div className="rounded-2xl border border-slate-100 bg-white/80 p-6 text-sm text-slate-500">
          正在加载文章...
        </div>
      ) : null}

      <div className="flex items-center justify-between rounded-xl border border-black/5 bg-white/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">状态</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value as PostFormData["status"])}
          >
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">发布</option>
            <option value="OFFLINE">下线</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.isTop}
              onChange={(e) => updateField("isTop", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            置顶
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving || isLoading}
            className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "保存中..." : editId ? "更新文章" : "发布文章"}
          </button>
          <Link
            href="/admin/posts"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            取消返回
          </Link>
        </div>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">
              标题 <span className="text-red-400">*</span>
            </span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              placeholder="输入文章标题..."
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              onBlur={handleTitleBlur}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">URL Slug</span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              placeholder="url-friendly-slug"
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              required
            />
          </label>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">摘要</span>
            <textarea
              className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              placeholder="简短描述文章内容，用于列表展示和 SEO。"
              value={form.summary}
              onChange={(e) => updateField("summary", e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">阅读时长</span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              placeholder="8 min"
              value={form.readingTime}
              onChange={(e) => updateField("readingTime", e.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">分类</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
              value={form.categoryId === "" ? "" : String(form.categoryId)}
              onChange={(e) =>
                updateField("categoryId", e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">不选择</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">标签</span>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.slug}
                  type="button"
                  onClick={() => toggleTag(tag.slug)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    form.tagSlugs.includes(tag.slug)
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            {form.tagSlugs.length > 0 ? (
              <p className="mt-1 text-xs text-slate-400">已选：{form.tagSlugs.join(", ")}</p>
            ) : null}
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            正文内容 <span className="font-normal text-slate-400">(Markdown)</span>
          </span>
          <textarea
            className="min-h-[320px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm leading-relaxed placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            placeholder="# 标题\n\n## 第一段\n\n写点东西...\n"
            value={form.content}
            onChange={(e) => updateField("content", e.target.value)}
          />
          <p className="text-xs text-slate-400">支持 Markdown 语法。代码块请用三个反引号包裹。</p>
        </label>
      </form>
    </AdminShell>
  );
}
