import { SiteShell } from "@/components/site/site-shell";
import { AboutPage } from "@/modules/profile/about-page";
import {
  getAboutSections,
  getProfileInfo,
  getSiteConfig,
  getTimeline,
} from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于我",
  description:
    "了解更多关于 Feiyuz 的信息：三维图形开发技术专长、应用开发能力、工作经历与博客定位。",
};

export default async function AboutRoute() {
  const [config, sections, profile, timeline] = await Promise.all([
    getSiteConfig(),
    getAboutSections(),
    getProfileInfo(),
    getTimeline(),
  ]);

  return (
    <SiteShell config={config}>
      <AboutPage profile={profile} sections={sections} timeline={timeline} />
    </SiteShell>
  );
}
