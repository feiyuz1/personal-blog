import { AdminShell } from "@/components/admin/admin-shell";
import { Panel } from "@/components/ui/panel";
import { requireAdmin } from "@/lib/auth/session";
import { getSiteConfig } from "@/services/content-service";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const siteConfig = await getSiteConfig();

  return (
    <AdminShell
      title="系统设置"
      description="配置站点的基础信息、SEO 参数和社交链接。当前仅做界面展示，后续可接入编辑与保存。"
    >
      <Panel
        title="基础信息"
        description="站点名称和描述会在导航栏、页脚和 SEO 中显示。"
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">站点标题</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              defaultValue={siteConfig.title}
              disabled
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">副标题</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              defaultValue={siteConfig.subtitle}
              disabled
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">站点描述</span>
            <textarea
              className="min-h-24 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              defaultValue={siteConfig.description}
              disabled
            />
          </label>
        </div>
      </Panel>

      <Panel
        title="导航配置"
        description="这些链接来源于 Prisma 内容块，后续可以改成后台可编辑。"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">主导航数量</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              defaultValue={String(siteConfig.navItems.length)}
              disabled
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">页脚链接数量</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              defaultValue={String(siteConfig.footerLinks.length)}
              disabled
            />
          </label>
        </div>
      </Panel>

      <Panel
        title="统计概览"
        description="首页右侧的统计卡片同样来自 Prisma 内容块。"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {siteConfig.stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{stat.value}</p>
              {stat.hint ? <p className="mt-2 text-xs text-slate-500">{stat.hint}</p> : null}
            </div>
          ))}
        </div>
      </Panel>

      <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/80 p-4">
        <button
          className="cursor-not-allowed rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white opacity-50"
          disabled
        >
          保存更改
        </button>
        <span className="text-xs text-slate-400">当前页面仅用于展示内容块数据，后续再接入可编辑表单。</span>
      </div>
    </AdminShell>
  );
}
