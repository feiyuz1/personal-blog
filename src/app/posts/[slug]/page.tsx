import { SiteShell } from "@/components/site/site-shell";
import { PostDetailPage } from "@/modules/posts/post-detail-page";
import { getPostBySlug, getSiteConfig } from "@/services/content-service";

export default async function PostDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [config, post] = await Promise.all([
    getSiteConfig(),
    getPostBySlug(slug),
  ]);

  return (
    <SiteShell config={config}>
      <PostDetailPage post={post} />
    </SiteShell>
  );
}
