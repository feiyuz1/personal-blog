import { SiteShell } from "@/components/site/site-shell";
import { AboutPage } from "@/modules/profile/about-page";
import {
  getAboutSections,
  getProfileInfo,
  getSiteConfig,
  getTechStacks,
  getTimeline,
} from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于我",
  description:
    "了解更多关于 Feiyuz 的信息：个人简介、技术栈、工作经历和博客定位。全栈开发者与技术写作者。",
};

export default async function AboutRoute() {
  const [config, sections, profile, techStacks, timeline] =
    await Promise.all([
      getSiteConfig(),
      getAboutSections(),
      getProfileInfo(),
      getTechStacks(),
      getTimeline(),
    ]);

  return (
    <SiteShell config={config}>
      <AboutPage
        profile={profile}
        sections={sections}
        techStacks={techStacks}
        timeline={timeline}
      />
    </SiteShell>
  );
}
