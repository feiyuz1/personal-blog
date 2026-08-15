import { SiteShell } from "@/components/site/site-shell";
import { HomePage } from "@/modules/home/home-page";
import {
  getSiteConfig,
  listFeaturedPosts,
  listPosts,
  listCategories,
  listTags,
} from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "首页",
  description:
    "Feiyuz Blog - 个人技术博客，聚焦全栈开发、架构设计、工程实践与个人成长。精选文章推荐与最新更新。",
};

export default async function Home() {
  const [config, featuredPosts, allPosts, categories, tags] =
    await Promise.all([
      getSiteConfig(),
      listFeaturedPosts(),
      listPosts(),
      listCategories(),
      listTags(),
    ]);

  // 最新文章 = 全部文章按时间排序，排除已推荐的文章
  const featuredSlugs = new Set(featuredPosts.map((p) => p.slug));
  const latestPosts = allPosts
    .filter((p) => !featuredSlugs.has(p.slug))
    .slice(0, 5);

  return (
    <SiteShell config={config}>
      <HomePage
        config={config}
        featuredPosts={featuredPosts}
        latestPosts={latestPosts}
        categories={categories}
        tags={tags}
      />
    </SiteShell>
  );
}
