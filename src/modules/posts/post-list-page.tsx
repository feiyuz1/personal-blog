import Link from "next/link";

import { PostCard } from "@/components/content/post-card";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { Pagination } from "@/components/ui/pagination";
import type { CategorySummary, PostSummary, TagSummary } from "@/types/content";

export function PostListPage({
  posts,
  categories,
  tags,
  currentPage = 1,
  totalPages = 1,
}: {
  posts: PostSummary[];
  categories: CategorySummary[];
  tags: TagSummary[];
  currentPage?: number;
  totalPages?: number;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero
        eyebrow="Blog"
        title="全部文章"
        description="记录技术思考、项目复盘和学习笔记。按时间倒序排列，持续更新中。"
      />

      <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.slug} post={post} />)
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

          {totalPages > 1 ? (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/blog"
            />
          ) : null}
        </div>

        <aside className="space-y-6">
          {/* 分类入口 */}
          <Panel
            title="分类"
            description="按主题分类浏览"
          >
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link key={category.slug} href={`/categories/${category.slug}`}>
                  <Pill label={`${category.name} (${category.count})`} />
                </Link>
              ))}
            </div>
          </Panel>

          {/* 标签云 */}
          <Panel
            title="标签"
            description="探索技术话题"
          >
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link key={tag.slug} href={`/tags/${tag.slug}`}>
                  <Pill label={`#${tag.name}`} />
                </Link>
              ))}
            </div>
          </Panel>

          {/* 关于博主 */}
          <Panel title="关于" description="">
            <p className="text-sm leading-7 text-slate-600">
              一个热爱全栈开发和技术写作的工程师。这里记录我在 Web
              开发路上的学习笔记、项目复盘和思考沉淀。
            </p>
            <Link
              href="/about"
              className="mt-3 inline-block text-sm font-medium text-emerald-800 transition hover:text-emerald-900"
            >
              了解更多 &rarr;
            </Link>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
