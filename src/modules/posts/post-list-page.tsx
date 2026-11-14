import Link from "next/link";

import { PostCard } from "@/components/content/post-card";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import type { CategorySummary, PostSummary, TagSummary } from "@/types/content";

function groupPostsByMonth(posts: PostSummary[]) {
  const months = new Map<string, PostSummary[]>();
  const sortedPosts = posts.toSorted((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt),
  );

  for (const post of sortedPosts) {
    const month = post.publishedAt.slice(0, 7);
    const group = months.get(month);
    if (group) {
      group.push(post);
    } else {
      months.set(month, [post]);
    }
  }

  return Array.from(months, ([id, posts]) => {
    const [year, month] = id.split("-");
    return {
      id: `archive-${id}`,
      label: `${year} 年 ${Number(month)} 月`,
      tick: `${year}.${month}`,
      posts,
    };
  });
}

export function PostListPage({
  posts,
  categories,
  tags,
}: {
  posts: PostSummary[];
  categories: CategorySummary[];
  tags: TagSummary[];
}) {
  const months = groupPostsByMonth(posts);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero
        eyebrow="Blog"
        title="全部文章"
        description="记录技术思考、项目复盘和学习笔记。按时间倒序排列，持续更新中。"
      />

      <div
        id="archive"
        className={`grid scroll-mt-32 gap-x-2 gap-y-6 sm:gap-x-4 lg:gap-x-6 ${
          months.length > 0
            ? "grid-cols-[3.5rem_minmax(0,1fr)] sm:grid-cols-[4.5rem_minmax(0,1fr)] lg:grid-cols-[4.5rem_minmax(0,1fr)_12rem]"
            : "lg:grid-cols-[minmax(0,1fr)_12rem]"
        }`}
      >
        {months.length > 0 && (
          <nav
            aria-label="按发布时间定位"
            className="sticky top-28 max-h-[min(14rem,calc(100dvh-8rem))] self-start overflow-y-auto lg:top-24"
          >
            <ul className="border-l border-emerald-800/25">
              {months.map(({ id, label, tick }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-label={label}
                    className="relative block rounded-r-md py-2 pr-0.5 pl-2 text-xs font-medium whitespace-nowrap text-slate-600 tabular-nums before:absolute before:top-1/2 before:left-0 before:h-px before:w-1.5 before:bg-emerald-800/55 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-700 sm:pl-3"
                  >
                    {tick}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="min-w-0 space-y-7">
          {months.length > 0 ? (
            months.map((month) => (
              <section
                key={month.id}
                id={month.id}
                aria-labelledby={`${month.id}-heading`}
                className="group scroll-mt-32 space-y-4"
              >
                <h2
                  id={`${month.id}-heading`}
                  className="text-base font-semibold text-slate-700 group-target:text-emerald-800"
                >
                  {month.label}
                </h2>
                {month.posts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </section>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-black/5 bg-white/80 p-12 text-center">
              <p className="text-lg font-semibold text-slate-900">
                这里还没有文章
              </p>
              <p className="mt-2 text-sm text-slate-500">
                第一篇文章发布后会出现在这里
              </p>
            </div>
          )}
        </div>

        <aside className="col-span-full min-w-0 space-y-4 lg:sticky lg:top-24 lg:col-span-1 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
          {/* 分类入口 */}
          <Panel title="分类" description="按主题分类浏览">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link key={category.slug} href={`/categories/${category.slug}`}>
                  <Pill label={`${category.name} (${category.count})`} />
                </Link>
              ))}
            </div>
          </Panel>

          {/* 标签云 */}
          <Panel title="标签" description="探索技术话题">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link key={tag.slug} href={`/tags/${tag.slug}`}>
                  <Pill label={`#${tag.name}`} />
                </Link>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
