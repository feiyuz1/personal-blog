import Link from "next/link";

import { PostCard } from "@/components/content/post-card";
import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import type { CategorySummary, PostSummary, TagSummary } from "@/types/content";

import { HomeSearch } from "./home-search";

type HomeOverview = {
  featuredPosts: PostSummary[];
  latestPosts: PostSummary[];
  categories: CategorySummary[];
  tags: TagSummary[];
};

type HomeSearchResult = {
  keyword: string;
  results: PostSummary[];
};

export function HomePage({
  overview,
  search,
}:
  | { overview: HomeOverview; search?: never }
  | {
      overview?: never;
      search: HomeSearchResult;
    }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-6 md:px-10 md:py-8">
      <HomeSearch key={search?.keyword ?? ""} keyword={search?.keyword ?? ""} />
      {search ? (
        <section aria-labelledby="search-results-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1
              id="search-results-heading"
              className="text-xl font-semibold text-slate-900"
            >
              搜索结果
            </h1>
            <Link
              href="/"
              className="text-sm font-medium text-emerald-800 hover:underline"
            >
              清除搜索
            </Link>
          </div>
          {search.results.length ? (
            <div className="grid gap-4">
              {search.results.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">没有找到匹配的文章。</p>
          )}
        </section>
      ) : (
        <Overview {...overview} />
      )}
    </div>
  );
}

function Overview({
  featuredPosts,
  latestPosts,
  categories,
  tags,
}: HomeOverview) {
  return (
    <>
      <h1 className="sr-only">首页</h1>
      {/* 置顶 / 推荐文章 */}
      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <Panel title="推荐文章" description="精选内容，值得从头读起。">
          <div className="grid gap-4">
            {featuredPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          {/* 分类快速入口 */}
          <Panel title="分类浏览" description="按主题分类查看文章">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link key={category.slug} href={`/categories/${category.slug}`}>
                  <Pill label={`${category.name} · ${category.count}`} />
                </Link>
              ))}
            </div>
          </Panel>

          {/* 热门标签 */}
          <Panel title="热门标签" description="探索你感兴趣的技术话题">
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 8).map((tag) => (
                <Link key={tag.slug} href={`/tags/${tag.slug}`}>
                  <Pill label={`# ${tag.name}`} />
                </Link>
              ))}
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
    </>
  );
}
