import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { Timeline } from "@/components/ui/timeline";
import { contactChannels } from "@/data/mock-content";
import type { AboutSection, ProfileInfo, TimelineItem } from "@/types/content";

import { TechExpertiseSection } from "./tech-expertise-section";

interface AboutPageProps {
  profile: ProfileInfo;
  sections: AboutSection[];
  timeline: TimelineItem[];
}

const focusItems = [
  { label: "主平台", value: "Unreal Engine 5" },
  { label: "核心方向", value: "三维图形 · 应用开发" },
  { label: "常用语言", value: "C++ · HLSL" },
];

function AboutFocusCard() {
  return (
    <aside className="h-full rounded-[1.5rem] border border-emerald-900/10 bg-linear-to-br from-emerald-50/90 via-white/60 to-[#f6f1e6] p-5">
      <p className="text-[10px] font-semibold tracking-[0.28em] text-emerald-800/50 uppercase">
        Focus
      </p>
      <dl className="mt-4 space-y-3">
        {focusItems.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-3 border-b border-emerald-900/10 pb-3 last:border-0 last:pb-0"
          >
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="text-right text-sm font-semibold text-slate-900">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

export function AboutPage({ profile, sections, timeline }: AboutPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero
        eyebrow="About"
        title="关于我"
        description={profile.bio}
        aside={<AboutFocusCard />}
      />

      {/* 技术专长：固定内容，直接维护在代码中 */}
      <TechExpertiseSection />

      {/* 经历时间线（数据库内容） */}
      {timeline.length > 0 ? (
        <Panel title="经历" description="工作与成长的关键节点。">
          <Timeline items={timeline} />
        </Panel>
      ) : null}

      {/* 博客信息区块（数据库内容） */}
      {sections.length > 0 ? (
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
      ) : null}

      <section
        id="contact"
        aria-labelledby="contact-heading"
        className="scroll-mt-32 rounded-[1.5rem] border border-black/5 bg-white/80 p-6 shadow-[0_18px_44px_rgba(34,58,45,0.06)]"
      >
        <h2
          id="contact-heading"
          className="mb-4 text-xl font-semibold text-slate-900"
        >
          联系我
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {contactChannels.map(({ label, value, href }) => (
            <div key={label} className="space-y-1">
              <dt className="text-sm font-medium text-slate-600">{label}</dt>
              <dd className="text-sm wrap-anywhere">
                <a
                  href={href}
                  className="font-medium text-emerald-800 underline decoration-emerald-800/30 underline-offset-4 hover:decoration-current"
                >
                  {value}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
