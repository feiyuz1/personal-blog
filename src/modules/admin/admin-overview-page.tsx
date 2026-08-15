import { AdminShell } from "@/components/admin/admin-shell";
import { Panel } from "@/components/ui/panel";
import type { AdminOverview } from "@/types/content";

export function AdminOverviewPage({ overview }: { overview: AdminOverview }) {
  return (
    <AdminShell
      title="后台概览"
      description="这里先放关键指标、快捷入口、草稿和待审核评论，为后续真实数据接入预留稳定页面结构。"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.metrics.map((metric) => (
          <Panel key={metric.label} title={metric.label}>
            <p className="text-3xl font-semibold text-slate-900">
              {metric.value}
            </p>
            {metric.trend ? (
              <p className="mt-2 text-sm text-slate-500">{metric.trend}</p>
            ) : null}
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="快捷操作">
          <div className="space-y-4">
            {overview.quickActions.map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="block rounded-2xl border border-black/5 bg-slate-50 p-4"
              >
                <p className="font-semibold text-slate-900">{action.label}</p>
                <p className="mt-1 text-sm leading-7 text-slate-600">
                  {action.description}
                </p>
              </a>
            ))}
          </div>
        </Panel>

        <Panel title="草稿文章">
          <div className="space-y-4">
            {overview.draftPosts.map((post) => (
              <div
                key={post.slug}
                className="rounded-2xl border border-black/5 bg-slate-50 p-4"
              >
                <p className="font-semibold text-slate-900">{post.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {post.summary}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="待审核评论">
        <div className="space-y-4">
          {overview.commentQueue.map((comment) => (
            <div
              key={comment.id}
              className="rounded-2xl border border-black/5 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-slate-900">
                  {comment.postTitle}
                </p>
                <span className="text-xs tracking-[0.2em] text-amber-700 uppercase">
                  {comment.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{comment.author}</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {comment.excerpt}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </AdminShell>
  );
}
