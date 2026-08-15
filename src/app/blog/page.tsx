import { SiteShell } from "@/components/site/site-shell";
import { PostListPage } from "@/modules/posts/post-list-page";
import {
  getSiteConfig,
  listCategories,
  listPosts,
  listTags,
} from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "博客",
  description:
    "浏览全部技术文章，涵盖 Next.js、TypeScript、React、PostgreSQL 等主题。按时间倒序排列，支持分类和标签筛选。",
};

export default async function BlogPage() {
  const [config, posts, categories, tags] = await Promise.all([
    getSiteConfig(),
    listPosts(),
    listCategories(),
    listTags(),
  ]);

  return (
    <SiteShell config={config}>
      <PostListPage posts={posts} categories={categories} tags={tags} />
    </SiteShell>
  );
}
