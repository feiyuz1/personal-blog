import Link from "next/link";

import type { SiteConfig } from "@/types/content";

const QUICK_LINKS = [
  { href: "/blog", label: "全部文章" },
  { href: "/projects", label: "项目展示" },
  { href: "/archive", label: "文章归档" },
  { href: "/about", label: "关于我" },
];

export function SiteHeader({
  config,
  showSearchLink,
}: {
  config: SiteConfig;
  showSearchLink: boolean;
}) {
  const navItems = new Map(QUICK_LINKS.map(({ href, label }) => [href, label]));
  for (const { href, label } of config.navItems) {
    if (!navItems.has(href) && (showSearchLink || href !== "/search")) {
      navItems.set(href, label);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[rgba(244,239,229,0.82)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-2 px-6 py-3 md:flex-row md:items-center md:justify-between md:gap-6 md:px-10">
        <Link href="/" className="shrink-0">
          {config.heroLabel && (
            <span className="block text-xs font-semibold tracking-[0.28em] text-emerald-800/70 uppercase">
              {config.heroLabel}
            </span>
          )}
          <span className="block text-lg font-semibold text-slate-900">
            {config.title}
          </span>
        </Link>

        <nav
          aria-label="站点导航"
          className="flex max-w-full min-w-0 items-center gap-3 overflow-x-auto md:gap-5"
        >
          {Array.from(navItems, ([href, label]) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 py-1.5 text-sm font-medium whitespace-nowrap text-slate-700 transition hover:text-slate-950"
            >
              {label}
            </Link>
          ))}
          {showSearchLink && !navItems.has("/search") && (
            <Link
              href="/search"
              className="shrink-0 rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
            >
              搜索
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
