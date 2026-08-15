import { notImplemented } from "@/lib/api-response";

export async function GET() {
  return notImplemented({
    route: "/api/rss",
    status: "planned",
    description: "RSS 订阅将在后续版本根据文章列表动态生成。",
    responseShape: {
      contentType: "application/rss+xml",
      body: "<rss>...</rss>",
    },
  });
}
