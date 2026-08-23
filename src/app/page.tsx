import { SiteShell } from "@/components/site/site-shell";
import { HomePage } from "@/modules/home/home-page";
import {
  getSiteConfig,
  listFeaturedPosts,
  listPosts,
  listCategories,
  listProjects,
  listTags,
} from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "首页",
  description:
    "Feiyuz Blog - 个人技术博客，聚焦 C++、图形学与 Unreal Engine。精选文章推荐与最新更新。",
};

export default async function Home() {
  const [config, featuredPosts, allPosts, categories, tags, projects] =
    await Promise.all([
      getSiteConfig(),
      listFeaturedPosts(),
      listPosts(),
      listCategories(),
      listTags(),
      listProjects(),
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
        stats={[
          { label: "文章", value: String(allPosts.length), hint: "已发布" },
          { label: "项目", value: String(projects.length), hint: "作品与练习" },
          { label: "分类", value: String(categories.length), hint: "内容分类" },
          { label: "标签", value: String(tags.length), hint: "主题索引" },
        ]}
      />
    </SiteShell>
  );
}
