import { SiteShell } from "@/components/site/site-shell";
import { TaxonomyIndexPage } from "@/modules/taxonomy/taxonomy-index-page";
import { getSiteConfig, listCategories } from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "分类",
  description:
    "按主题分类浏览博客文章，包括技术开发、项目总结、学习笔记等栏目。",
};

export default async function CategoriesPage() {
  const [config, items] = await Promise.all([
    getSiteConfig(),
    listCategories(),
  ]);

  return (
    <SiteShell config={config}>
      <TaxonomyIndexPage
        eyebrow="Categories"
        title="全部分类"
        description="按主题分类浏览所有文章，每个分类聚焦一个内容方向，让知识体系更清晰。"
        basePath="/categories"
        items={items}
      />
    </SiteShell>
  );
}
