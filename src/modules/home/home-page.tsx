import Link from "next/link";

import { PostCard } from "@/components/content/post-card";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import type { CategorySummary, PostSummary, SiteConfig, TagSummary } from "@/types/content";

export function HomePage({
  config,
  featuredPosts,
  latestPosts,
  categories,
  tags,
}: {
  config: SiteConfig;
  featuredPosts: PostSummary[];
  latestPosts: PostSummary[];
  categories: CategorySummary[];
  tags: TagSummary[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero
        eyebrow={config.heroLabel}
        title={config.title}
        description={config.description}
        aside={
          <div className="rounded-[1.5rem] bg-slate-950 p-6 text-slate-50">
            <p className="text-sm tracking-[0.24em] text-emerald-300/80 uppercase">
              博客数据
            </p>
            <div className="mt-4 space-y-3">
              {config.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-200">{stat.label}</p>
                  {stat.hint ? (
                    <p className="mt-2 text-xs text-slate-400">{stat.hint}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        }
      />

      {/* 置顶 / 推荐文章 */}
      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <Panel
          title="推荐文章"
          description="精选内容，值得从头读起。"
        >
          <div className="grid gap-4">
            {featuredPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          {/* 分类快速入口 */}
          <Panel
            title="分类浏览"
            description="按主题分类查看文章"
          >
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                >
                  <Pill
                    label={`${category.name} · ${category.count}`}
                  />
                </Link>
              ))}
            </div>
          </Panel>

          {/* 热门标签 */}
          <Panel
            title="热门标签"
            description="探索你感兴趣的技术话题"
          >
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 8).map((tag) => (
                <Link key={tag.slug} href={`/tags/${tag.slug}`}>
                  <Pill label={`# ${tag.name}`} />
                </Link>
              ))}
            </div>
          </Panel>

          {/* 快速导航 */}
          <Panel title="快速入口" description="常用页面直达。">
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/blog"
                className="rounded-full bg-slate-950 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
              >
                全部文章
              </Link>
              <Link
                href="/projects"
                className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                项目展示
              </Link>
              <Link
                href="/archive"
                className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                文章归档
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                关于我
              </Link>
            </div>
          </Panel>
        </div>
      </section>

      {/* 最新文章列表 */}
      <Panel
        title="最新更新"
        description="最近发布或更新的文章，保持学习节奏。"
      >
        <div className="grid gap-4">
          {latestPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/blog"
            className="inline-block rounded-full border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
          >
            查看全部文章 &rarr;
          </Link>
        </div>
      </Panel>
    </div>
  );
}
