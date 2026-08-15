import Link from "next/link";

import type { SiteConfig } from "@/types/content";

export function SiteHeader({ config }: { config: SiteConfig }) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[rgba(244,239,229,0.82)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-10">
        <Link href="/" className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.28em] text-emerald-800/70 uppercase">
            {config.heroLabel}
          </p>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {config.title}
            </p>
            <p className="text-sm text-slate-600">{config.subtitle}</p>
          </div>
        </Link>

        <nav className="hidden flex-wrap items-center gap-5 md:flex">
          {config.navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/search"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            搜索
          </Link>
        </nav>
      </div>
    </header>
  );
}
