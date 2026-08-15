"use client";

import Link from "next/link";

import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import type { ContactChannel } from "@/types/content";

export function ContactPage({ channels }: { channels: ContactChannel[] }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero
        eyebrow="Contact"
        title="联系我"
        description="如果你有技术问题想讨论、合作机会想探讨，或者只是想打个招呼，欢迎通过以下方式联系我。"
      />

      {/* 联系渠道卡片 */}
      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((channel) => (
          <Panel key={channel.label} title={channel.label}>
            <div className="space-y-2 text-sm leading-7 text-slate-700">
              {channel.href ? (
                <Link
                  href={channel.href}
                  className="font-medium text-emerald-800 underline decoration-emerald-800/30 underline-offset-4 transition hover:text-emerald-900"
                >
                  {channel.value}
                </Link>
              ) : (
                <p className="font-medium text-slate-900">{channel.value}</p>
              )}
              {channel.note ? (
                <p className="text-slate-500">{channel.note}</p>
              ) : null}
            </div>
          </Panel>
        ))}
      </div>

      {/* 留言表单占位 */}
      <Panel
        title="在线留言"
        description="也可以直接在这里留言，我看到后会尽快回复。"
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>
              称呼 <span className="text-red-400">*</span>
            </span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm transition placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/20"
              placeholder="你的称呼"
              disabled
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>
              邮箱 <span className="text-red-400">*</span>
            </span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm transition placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/20"
              placeholder="your@email.com"
              type="email"
              disabled
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>留言内容</span>
            <textarea
              className="min-h-32 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm transition placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/20"
              placeholder="想说点什么..."
              disabled
            />
          </label>
          <div className="md:col-span-2">
            <button
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white opacity-50 cursor-not-allowed"
              type="submit"
              disabled
            >
              发送留言（功能开发中）
            </button>
          </div>
        </form>
      </Panel>

      {/* 其他说明 */}
      <Panel
        title="响应时间"
        description="关于回复的一些预期"
      >
        <div className="space-y-3 text-sm leading-7 text-slate-600">
          <p>
            邮件通常在 <strong className="text-slate-900">24 小时内</strong>{" "}
            回复，复杂问题可能需要更长时间研究。
          </p>
          <p>
            如果是技术咨询，建议在留言中尽量描述清楚问题和已有尝试，
            这样我能更快给出有价值的建议。
          </p>
          <p>
            评论区功能正在开发中，届时你也可以直接在文章下方参与讨论。
          </p>
        </div>
      </Panel>
    </div>
  );
}
