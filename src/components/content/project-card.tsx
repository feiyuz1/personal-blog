import Link from "next/link";

import { Pill } from "@/components/ui/pill";
import type { ProjectSummary } from "@/types/content";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <article className="rounded-[1.5rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_44px_rgba(34,58,45,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-slate-900">
          <Link href={`/projects/${project.slug}`}>{project.name}</Link>
        </h3>
        <Pill label={project.status} />
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-600">{project.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.techStack.map((item) => (
          <Pill key={item} label={item} />
        ))}
      </div>
    </article>
  );
}
