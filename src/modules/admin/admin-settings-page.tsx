"use client";

import { useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Panel } from "@/components/ui/panel";

// 站点设置数据结构（对应 SiteSetting 表字段）
interface SiteSettings {
  id?: string;
  siteTitle?: string | null;
  siteSubtitle?: string | null;
  logoUrl?: string | null;
  footerText?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  socialLinks?: unknown;
}

/**
 * 系统设置页（客户端组件）。
 *
 * 职责：
 *  - 以表单形式编辑站点基础信息、SEO 参数、社交链接；
 *  - 保存时调用 PUT /api/admin/settings 写入 site_settings 表；
 *  - socialLinks 以 JSON 文本编辑，保存前校验格式。
 */
export function AdminSettingsPage({
  initialSettings,
}: {
  initialSettings: SiteSettings | null;
}) {
  // 表单各字段状态
  const [siteTitle, setSiteTitle] = useState(initialSettings?.siteTitle ?? "");
  const [siteSubtitle, setSiteSubtitle] = useState(initialSettings?.siteSubtitle ?? "");
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logoUrl ?? "");
  const [footerText, setFooterText] = useState(initialSettings?.footerText ?? "");
  const [seoTitle, setSeoTitle] = useState(initialSettings?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialSettings?.seoDescription ?? "");
  const [seoKeywords, setSeoKeywords] = useState(initialSettings?.seoKeywords ?? "");
  // socialLinks 用 JSON 文本展示与编辑
  const [socialLinksText, setSocialLinksText] = useState(() =>
    initialSettings?.socialLinks
      ? JSON.stringify(initialSettings.socialLinks, null, 2)
      : "",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 保存设置
  async function handleSave() {
    setError(null);
    setSuccess(null);

    // 解析 socialLinks JSON 文本，允许为空
    let socialLinks: unknown = null;
    if (socialLinksText.trim()) {
      try {
        socialLinks = JSON.parse(socialLinksText);
      } catch {
        setError("社交链接不是合法的 JSON 格式，请检查后再保存。");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteTitle,
          siteSubtitle,
          logoUrl,
          footerText,
          seoTitle,
          seoDescription,
          seoKeywords,
          socialLinks,
        }),
      });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setError(json.message ?? "保存失败");
      } else {
        setSuccess("已保存");
      }
    } catch {
      setError("网络错误，保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="系统设置"
      description="配置站点基础信息、SEO 参数和社交链接。保存后立即生效于后台 SEO 默认配置。"
    >
      {/* 基础信息 */}
      <Panel
        title="基础信息"
        description="站点名称和描述会在 SEO 元信息和后台展示中使用。"
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">站点标题</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">副标题</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              value={siteSubtitle}
              onChange={(e) => setSiteSubtitle(e.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Logo URL</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="/logo.png"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">页脚文本</span>
            <textarea
              className="min-h-20 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
            />
          </label>
        </div>
      </Panel>

      {/* SEO 配置 */}
      <Panel
        title="SEO 配置"
        description="作为文章未单独配置 SEO 时的默认标题、描述和关键词。"
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">默认 SEO 标题</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">默认 SEO 描述</span>
            <textarea
              className="min-h-20 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">默认 SEO 关键词</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="博客, 技术, 个人博客"
            />
          </label>
        </div>
      </Panel>

      {/* 社交链接 */}
      <Panel
        title="社交链接"
        description="以 JSON 对象格式编辑，例如 {&quot;github&quot;:&quot;https://github.com/xxx&quot;}。留空则不保存。"
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">社交链接（JSON）</span>
          <textarea
            className="min-h-32 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs focus:border-emerald-600 focus:outline-none"
            value={socialLinksText}
            onChange={(e) => setSocialLinksText(e.target.value)}
            placeholder={'{\n  "github": "https://github.com/yourname",\n  "email": "you@example.com"\n}'}
          />
        </label>
      </Panel>

      {/* 操作栏 */}
      <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/80 p-4">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存更改"}
        </button>
        {error ? (
          <span className="text-xs text-red-600">{error}</span>
        ) : success ? (
          <span className="text-xs text-emerald-600">{success}</span>
        ) : null}
      </div>
    </AdminShell>
  );
}
