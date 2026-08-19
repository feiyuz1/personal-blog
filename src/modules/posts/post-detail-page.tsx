import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { PostComments } from "@/modules/posts/post-comments";
import type { CommentNode } from "@/services/content-service";
import type { PostDetail } from "@/types/content";

export function PostDetailPage({
  post,
  initialComments = [],
}: {
  post: PostDetail | null;
  initialComments?: CommentNode[];
}) {
  if (!post) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-12 md:px-10">
        <EmptyState
          title="文章未找到"
          description="这篇文章可能不存在或已被删除。你可以返回博客列表查看其他内容。"
        />
        <div className="mt-6 text-center">
          <Link
            href="/blog"
            className="inline-block rounded-full border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
          >
            返回博客列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero
        eyebrow={post.category.name}
        title={post.title}
        description={post.summary}
        aside={
          <div className="rounded-[1.5rem] bg-slate-950 p-6 text-slate-50">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0114.25 18H5.75A1.75 1.75 0 014 16.25V5.75C4 4.784 4.784 4 5.75 4H6V2.75A.75.75 0 015.75 2zm-1 5.5v8.25c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V7.5h-9z"
                  clipRule="evenodd"
                />
              </svg>
              {post.publishedAt}
            </div>
            <p className="mt-3 text-sm text-slate-300">{post.readingTime}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link key={tag.slug} href={`/tags/${tag.slug}`}>
                  <Pill label={tag.name} variant="light" />
                </Link>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-slate-400">分类</p>
              <Link
                href={`/categories/${post.category.slug}`}
                className="mt-1 block text-sm font-medium text-emerald-300 hover:underline"
              >
                {post.category.name}
              </Link>
            </div>
          </div>
        }
      />

      {/* 文章正文 */}
      <Panel
        title=""
        description=""
      >
        <div className="prose prose-slate max-w-none space-y-8">
          {post.sections.map((section) => (
            <section key={section.title} className="space-y-3" id={section.title.toLowerCase().replace(/\s+/g, '-')}>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 scroll-mt-24">
                {section.title}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-base leading-8 text-slate-700"
                >
                  {paragraph}
                </p>
              ))}
              {section.kind === "code" && section.code ? (
                <pre className="overflow-x-auto rounded-3xl bg-slate-950 p-5 text-sm leading-relaxed text-slate-100">
                  <code>{section.code}</code>
                </pre>
              ) : null}
              {section.kind === "quote" ? (
                <blockquote className="rounded-3xl border-l-4 border-emerald-700/40 bg-emerald-50 px-5 py-4 text-base leading-7 text-slate-700 italic">
                  &ldquo;{section.body[0]}&rdquo;
                </blockquote>
              ) : null}
            </section>
          ))}
        </div>
      </Panel>

      {/* 侧边栏：目录 + 上下篇 */}
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div /> {/* 占位，保持布局 */}
        <aside className="space-y-6">
          {/* 目录 */}
          {post.toc.length > 0 ? (
            <Panel
              title="目录"
              description="快速跳转到各章节"
            >
              <nav aria-label="文章目录">
                <ul className="space-y-2.5 text-sm">
                  {post.toc.map((item) => (
                    <li key={item}>
                      <a
                        href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block text-slate-600 transition hover:text-emerald-800"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </Panel>
          ) : null}

          {/* 上一篇 / 下一篇 */}
          <Panel
            title="上下篇"
            description="继续阅读其他文章"
          >
            <nav
              className="space-y-3 text-sm"
              aria-label="文章导航"
            >
              {post.previousPostSlug ? (
                <Link
                  href={`/posts/${post.previousPostSlug}`}
                  className="group flex items-center gap-2 text-slate-700 transition hover:text-emerald-800"
                >
                  <span>&larr;</span>
                  <span>上一篇文章</span>
                </Link>
              ) : null}
              {post.nextPostSlug ? (
                <Link
                  href={`/posts/${post.nextPostSlug}`}
                  className="group flex items-center justify-between gap-2 text-slate-700 transition hover:text-emerald-800"
                >
                  <span>下一篇文章</span>
                  <span>&rarr;</span>
                </Link>
              ) : null}
              {!post.previousPostSlug && !post.nextPostSlug ? (
                <p className="text-slate-400">暂无关联文章</p>
              ) : null}
            </nav>
          </Panel>
        </aside>
      </div>

      {/* 评论区：展示已通过评论并支持提交新评论 */}
      {post.id ? (
        <PostComments postId={post.id} initialComments={initialComments} />
      ) : null}
    </article>
  );
}
