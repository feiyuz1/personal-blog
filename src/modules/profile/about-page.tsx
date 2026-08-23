import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { TechStackGrid } from "@/components/ui/tech-stack-grid";
import { Timeline } from "@/components/ui/timeline";
import type {
  AboutSection,
  ProfileInfo,
  TechStackCategory,
  TimelineItem,
} from "@/types/content";

interface AboutPageProps {
  profile: ProfileInfo;
  sections: AboutSection[];
  techStacks: TechStackCategory[];
  timeline: TimelineItem[];
}

export function AboutPage({
  profile,
  sections,
  techStacks,
  timeline,
}: AboutPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero eyebrow="About" title="关于我" description={profile.bio} />

      {/* 技术栈 */}
      <Panel title="技术栈" description="日常使用和熟练掌握的技术领域与工具">
        <TechStackGrid categories={techStacks} />
      </Panel>

      {/* 经历时间线 */}
      <Panel title="经历" description="工作与成长的关键节点。">
        <Timeline items={timeline} />
      </Panel>

      {/* 博客信息区块 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <Panel key={section.title} title={section.title}>
            <ul className="space-y-3 text-sm leading-7 text-slate-700">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  );
}
