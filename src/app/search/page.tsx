import { SiteShell } from "@/components/site/site-shell";
import { SearchPage } from "@/modules/search/search-page";
import { getSiteConfig, searchPosts } from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "搜索",
  description:
    "在 Feiyuz Blog 中搜索文章。支持标题、摘要和标签关键词搜索。",
};

export default async function SearchRoute({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string }>;
}) {
  const { keyword = "" } = await searchParams;
  const [config, results] = await Promise.all([
    getSiteConfig(),
    searchPosts(keyword),
  ]);

  return (
    <SiteShell config={config}>
      <SearchPage keyword={keyword} results={results} />
    </SiteShell>
  );
}
