import Link from "next/link";

import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import type { ArchiveGroup } from "@/types/content";

export function ArchivePage({ groups }: { groups: ArchiveGroup[] }) {
  const totalPosts = groups.reduce(
    (sum, group) =>
      sum + group.items.reduce((s, m) => s + m.posts.length, 0),
    0
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero
        eyebrow="Archive"
        title="文章归档"
        description={`按时间线浏览全部 ${totalPosts} 篇文章，从最新到最早排列。`}
      />

      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <Panel
              key={group.year}
              title={`${group.year} 年`}
              description={`${group.items.reduce((s, m) => s + m.posts.length, 0)} 篇文章`}
            >
              <div className="space-y-5">
                {group.items.map((month) => (
                  <section key={`${group.year}-${month.month}`}>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      {parseInt(month.month)} 月
                      <span className="text-sm font-normal text-slate-400">
                        ({month.posts.length} 篇)
                      </span>
                    </h3>
                    <ul className="mt-3 space-y-1.5">
                      {month.posts.map((post) => (
                        <li
                          key={post.slug}
                          className="group flex items-center justify-between gap-4 rounded-xl px-3 py-2 transition hover:bg-slate-50"
                        >
                          <Link
                            href={`/posts/${post.slug}`}
                            className="text-sm text-slate-700 transition group-hover:text-emerald-800"
                          >
                            {post.title}
                          </Link>
                          <span className="shrink-0 text-xs text-slate-400">
                            {post.publishedAt.split("-").slice(1).join("-")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-black/5 bg-white/80 p-12 text-center">
          <p className="text-lg font-semibold text-slate-900">归档为空</p>
          <p className="mt-2 text-sm text-slate-500">
            还没有任何已发布的文章
          </p>
        </div>
      )}
    </div>
  );
}
