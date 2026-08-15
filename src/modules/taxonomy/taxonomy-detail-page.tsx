import { PostCard } from "@/components/content/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import type { PostSummary } from "@/types/content";

export function TaxonomyDetailPage({
  eyebrow,
  title,
  description,
  posts,
}: {
  eyebrow: string;
  title: string;
  description: string;
  posts: PostSummary[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      {posts.length ? (
        <div className="grid gap-4">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="这里还没有内容"
          description="聚合页骨架已完成，后续只需要补真实查询即可。"
        />
      )}
    </div>
  );
}
