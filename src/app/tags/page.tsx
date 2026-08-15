import { SiteShell } from "@/components/site/site-shell";
import { TaxonomyIndexPage } from "@/modules/taxonomy/taxonomy-index-page";
import { getSiteConfig, listTags } from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "标签",
  description:
    "通过标签快速定位感兴趣的技术话题。涵盖 Next.js、TypeScript、React、PostgreSQL 等热门技术标签。",
};

export default async function TagsPage() {
  const [config, items] = await Promise.all([getSiteConfig(), listTags()]);

  return (
    <SiteShell config={config}>
      <TaxonomyIndexPage
        eyebrow="Tags"
        title="全部标签"
        description="通过标签快速定位感兴趣的技术话题，每个标签关联多篇相关文章。"
        basePath="/tags"
        items={items}
      />
    </SiteShell>
  );
}
