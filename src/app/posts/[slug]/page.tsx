import { SiteShell } from "@/components/site/site-shell";
import { PostDetailPage } from "@/modules/posts/post-detail-page";
import { getPostBySlug, getSiteConfig, listApprovedComments } from "@/services/content-service";

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

  // 文章存在时，服务端预取已通过评论，避免评论区首屏空白
  const comments = post?.id ? await listApprovedComments(BigInt(post.id)) : [];

  return (
    <SiteShell config={config}>
      <PostDetailPage post={post} initialComments={comments} />
    </SiteShell>
  );
}
