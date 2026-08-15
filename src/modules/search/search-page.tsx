"use client";

import { useRouter } from "next/navigation";

import { PostCard } from "@/components/content/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import type { PostSummary } from "@/types/content";

export function SearchPage({
  keyword,
  results,
}: {
  keyword: string;
  results: PostSummary[];
}) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const value = formData.get("keyword") as string;
    if (value.trim()) {
      router.push(`/search?keyword=${encodeURIComponent(value.trim())}`);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero
        eyebrow="Search"
        title="搜索"
        description="输入关键词搜索文章标题、摘要和标签。支持中文和英文关键词。"
      />

      <Panel
        title="搜索"
        description={`当前共 ${results.length} 篇相关文章${keyword ? `匹配「${keyword}」` : ""}`}
      >
        <form className="grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/20"
            defaultValue={keyword}
            name="keyword"
            placeholder="例如：Next.js、TypeScript、性能优化..."
          />
          <button
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            type="submit"
          >
            搜索
          </button>
        </form>
      </Panel>

      {keyword ? (
        results.length > 0 ? (
          <>
            <div className="grid gap-4">
              {results.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
            <p className="text-center text-xs text-slate-400">
              搜索功能当前基于本地 mock 数据过滤，
              后续将接入 PostgreSQL 全文检索或 Meilisearch 引擎。
            </p>
          </>
        ) : (
          <EmptyState
            title="没有找到匹配结果"
            description={`没有找到与「${keyword}」相关的文章。建议尝试更换关键词，或使用更通用的搜索词。`}
          />
        )
      ) : (
        <EmptyState
          title="输入关键词开始搜索"
          description="可以搜索文章标题、摘要内容和标签名称。试试搜索「Next.js」或「架构设计」。"
        />
      )}
    </div>
  );
}
