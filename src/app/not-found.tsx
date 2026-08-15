import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";
import { getSiteConfig } from "@/services/content-service";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const config = await getSiteConfig();

  return (
    <SiteShell config={config}>
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-20 text-center">
        <p className="text-7xl font-bold text-slate-200">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
          页面不存在
        </h1>
        <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
          你访问的页面可能已被移除、URL 输入有误，或者该内容尚未发布。
          不妨返回首页或通过搜索找到你需要的内容。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            返回首页
          </Link>
          <Link
            href="/blog"
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
          >
            浏览文章
          </Link>
          <Link
            href="/search"
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
          >
            搜索内容
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
