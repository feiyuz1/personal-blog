import Link from "next/link";

import { Pill } from "@/components/ui/pill";
import type { PostSummary } from "@/types/content";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="rounded-[1.5rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_44px_rgba(34,58,45,0.06)]">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span>{post.publishedAt}</span>
        <span>·</span>
        <span>{post.readingTime}</span>
        <span>·</span>
        <Link
          href={`/categories/${post.category.slug}`}
          className="font-medium text-emerald-800"
        >
          {post.category.name}
        </Link>
      </div>
      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{post.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Link key={tag.slug} href={`/tags/${tag.slug}`}>
            <Pill label={tag.name} />
          </Link>
        ))}
      </div>
    </article>
  );
}
