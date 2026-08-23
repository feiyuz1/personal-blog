import { NextResponse } from "next/server";

import { listPosts } from "@/services/content-service";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await listPosts();
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  const items = posts
    .map(
      (post) =>
        `\n    <item>\n      <title>${escapeXml(post.title)}</title>\n      <link>${siteUrl}/posts/${encodeURIComponent(post.slug)}</link>\n      <guid isPermaLink="true">${siteUrl}/posts/${encodeURIComponent(post.slug)}</guid>\n      <description>${escapeXml(post.summary)}</description>\n      <pubDate>${new Date(`${post.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>\n    </item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Feiyuz Blog</title>\n    <link>${siteUrl}</link>\n    <description>技术文章与项目笔记</description>${items}\n  </channel>\n</rss>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
