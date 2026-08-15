import { SiteShell } from "@/components/site/site-shell";
import { ArchivePage } from "@/modules/archive/archive-page";
import { getSiteConfig, listArchiveGroups } from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "文章归档",
  description:
    "按时间线浏览全部博客文章，从最新到最早排列。支持按年月快速定位历史内容。",
};

export default async function ArchiveRoute() {
  const [config, groups] = await Promise.all([
    getSiteConfig(),
    listArchiveGroups(),
  ]);

  return (
    <SiteShell config={config}>
      <ArchivePage groups={groups} />
    </SiteShell>
  );
}
