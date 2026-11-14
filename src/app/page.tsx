import { SiteShell } from "@/components/site/site-shell";
import { HomePage } from "@/modules/home/home-page";
import {
  getSiteConfig,
  listCategories,
  listPosts,
  listTags,
  searchPosts,
} from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "首页",
  description:
    "Feiyuz Blog - 个人技术博客，聚焦 C++、图形学与 Unreal Engine。精选文章推荐与最新更新。",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string | string[] }>;
}) {
  const { keyword } = await searchParams;
  const query = typeof keyword === "string" ? keyword.trim() : "";
  const configPromise = getSiteConfig();

  if (query) {
    const [config, results] = await Promise.all([
      configPromise,
      searchPosts(query),
    ]);

    return (
      <SiteShell config={config} showSearchLink={false}>
        <HomePage search={{ keyword: query, results }} />
      </SiteShell>
    );
  }

  const [config, posts, categories, tags] = await Promise.all([
    configPromise,
    listPosts(),
    listCategories(),
    listTags(),
  ]);

  // 最新文章 = 全部文章按时间排序，排除已推荐的文章
  const featuredPosts = posts.filter((post) => post.featured);
  const latestPosts = posts.filter((post) => !post.featured).slice(0, 5);

  return (
    <SiteShell config={config} showSearchLink={false}>
      <HomePage overview={{ featuredPosts, latestPosts, categories, tags }} />
    </SiteShell>
  );
}
