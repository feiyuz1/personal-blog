import { SiteShell } from "@/components/site/site-shell";
import { TaxonomyDetailPage } from "@/modules/taxonomy/taxonomy-detail-page";
import {
  getCategoryBySlug,
  getSiteConfig,
  listPostsByCategory,
} from "@/services/content-service";
import { notFound } from "next/navigation";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [config, category, posts] = await Promise.all([
    getSiteConfig(),
    getCategoryBySlug(slug),
    listPostsByCategory(slug),
  ]);

  if (!category) notFound();

  return (
    <SiteShell config={config}>
      <TaxonomyDetailPage
        eyebrow="Category"
        title={category?.name ?? "未命名分类"}
        description={
          category?.description ?? "分类骨架页，后续接真实分类说明。"
        }
        posts={posts}
      />
    </SiteShell>
  );
}
