import type { ReactNode } from "react";

import {
  techExpertise,
  type ExpertiseDomain,
  type ExpertiseGroup,
  type ExpertiseItem,
} from "@/data/tech-expertise";

const domainIcons: Record<ExpertiseDomain["id"], ReactNode> = {
  graphics: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z" />
      <path d="M12 3v18M5 7l7 4 7-4" />
    </svg>
  ),
  application: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 9v11" />
    </svg>
  ),
  toolchain: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m8 9-3 3 3 3M16 9l3 3-3 3M13.5 6l-3 12" />
    </svg>
  ),
};

function SkillChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-emerald-900/10 bg-emerald-50/80 px-2 py-0.5 text-[11px] leading-5 text-emerald-900/80">
      {label}
    </span>
  );
}

function ExpertiseItemRow({ item }: { item: ExpertiseItem }) {
  return (
    <li className="py-[7.5px] first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-sm font-medium text-slate-900">{item.label}</span>
        <span className="flex flex-wrap gap-1.5">
          {item.skills.map((skill) => (
            <SkillChip key={skill} label={skill} />
          ))}
        </span>
      </div>
    </li>
  );
}

function GroupBlock({ group }: { group: ExpertiseGroup }) {
  return (
    <div>
      {group.title ? (
        <h4 className="mb-3 text-base font-semibold tracking-[0.12em] text-emerald-800/80 uppercase">
          {group.title}
        </h4>
      ) : null}
      <ul className="divide-y divide-black/5">
        {group.items.map((item) => (
          <ExpertiseItemRow key={item.label} item={item} />
        ))}
      </ul>
    </div>
  );
}

function DomainHeading({ domain }: { domain: ExpertiseDomain }) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-900/10 bg-emerald-50 text-emerald-800 [&>svg]:h-5 [&>svg]:w-5">
        {domainIcons[domain.id]}
      </span>
      <div>
        <p className="text-[10px] font-semibold tracking-[0.28em] text-emerald-800/45 uppercase">
          {domain.index}
        </p>
        <h3 className="mt-0.5 text-lg font-semibold text-slate-900">
          {domain.title}
        </h3>
      </div>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50/70 px-3 py-1 text-[11px]">
      <span className="text-emerald-800/60">主要开发平台</span>
      <span className="font-semibold text-emerald-900">{platform}</span>
    </div>
  );
}

function FeaturedDomain({ domain }: { domain: ExpertiseDomain }) {
  return (
    <article className="rounded-[1.5rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_44px_rgba(34,58,45,0.06)] md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <DomainHeading domain={domain} />
        {domain.platform ? <PlatformBadge platform={domain.platform} /> : null}
      </div>

      <div className="mt-5 grid gap-x-8 gap-y-5 border-t border-black/5 pt-5 lg:grid-cols-2">
        {domain.groups.map((group) => (
          <GroupBlock key={group.title ?? "default"} group={group} />
        ))}
      </div>
    </article>
  );
}

function DomainCard({ domain }: { domain: ExpertiseDomain }) {
  return (
    <article className="flex flex-col rounded-[1.5rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_44px_rgba(34,58,45,0.06)]">
      <DomainHeading domain={domain} />

      <div className="mt-4 space-y-5 border-t border-black/5 pt-4">
        {domain.groups.map((group) => (
          <GroupBlock key={group.title ?? "default"} group={group} />
        ))}
      </div>
    </article>
  );
}

export function TechExpertiseSection() {
  const [featured, ...others] = techExpertise;

  return (
    <section
      aria-labelledby="tech-expertise-heading"
      className="rounded-[1.75rem] border border-black/5 bg-white/70 p-6 shadow-[0_18px_44px_rgba(34,58,45,0.06)] md:p-8"
    >
      <header className="space-y-2">
        <p className="text-sm font-semibold tracking-[0.28em] text-emerald-800/70 uppercase">
          Expertise
        </p>
        <h2
          id="tech-expertise-heading"
          className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl"
        >
          技术专长
        </h2>
      </header>

      <div className="mt-6 space-y-4">
        <FeaturedDomain domain={featured} />
        <div className="grid gap-4 md:grid-cols-2">
          {others.map((domain) => (
            <DomainCard key={domain.id} domain={domain} />
          ))}
        </div>
      </div>
    </section>
  );
}
