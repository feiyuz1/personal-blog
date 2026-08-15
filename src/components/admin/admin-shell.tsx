import Link from "next/link";
import type { ReactNode } from "react";

const adminNav = [
  { label: "概览", href: "/admin" },
  { label: "文章管理", href: "/admin/posts" },
  { label: "分类标签", href: "/admin/categories" },
  { label: "媒体资源", href: "/admin/media" },
  { label: "评论审核", href: "/admin/comments" },
  { label: "系统设置", href: "/admin/settings" },
];

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-8 md:grid-cols-[220px_1fr] md:px-10">
      <aside className="rounded-[1.5rem] border border-black/5 bg-slate-950 p-5 text-slate-50">
        <Link
          href="/"
          className="block rounded-2xl border border-white/10 px-4 py-3"
        >
          <p className="text-xs tracking-[0.24em] text-emerald-300/80 uppercase">
            Admin
          </p>
          <p className="mt-1 text-lg font-semibold">Blog Console</p>
        </Link>

        <nav className="mt-5 space-y-2">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-2xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="space-y-6">
        <section className="rounded-[1.5rem] border border-black/5 bg-white/80 p-8 shadow-[0_18px_44px_rgba(34,58,45,0.06)]">
          <p className="text-sm font-semibold tracking-[0.24em] text-emerald-800/70 uppercase">
            Admin Skeleton
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        </section>
        {children}
      </div>
    </div>
  );
}
