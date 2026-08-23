import { SiteShell } from "@/components/site/site-shell";
import { TaxonomyDetailPage } from "@/modules/taxonomy/taxonomy-detail-page";
import {
  getSiteConfig,
  getTagBySlug,
  listPostsByTag,
} from "@/services/content-service";
import { notFound } from "next/navigation";

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [config, tag, posts] = await Promise.all([
    getSiteConfig(),
    getTagBySlug(slug),
    listPostsByTag(slug),
  ]);

  if (!tag) notFound();

  return (
    <SiteShell config={config}>
      <TaxonomyDetailPage
        eyebrow="Tag"
        title={tag?.name ?? "未命名标签"}
        description="标签聚合页骨架，后续可接热度排序、标签说明与搜索高亮。"
        posts={posts}
      />
    </SiteShell>
  );
}
