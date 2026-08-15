import Link from "next/link";

import type { SiteConfig } from "@/types/content";

export function SiteFooter({ config }: { config: SiteConfig }) {
  return (
    <footer className="border-t border-black/5 bg-white/60">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 md:grid-cols-[1fr_auto] md:px-10">
        <div className="space-y-2">
          <p className="text-base font-semibold text-slate-900">
            {config.title}
          </p>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            {config.description}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-4 text-sm text-slate-700">
          {config.footerLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
