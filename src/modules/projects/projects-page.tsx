import { ProjectCard } from "@/components/content/project-card";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import type { ProjectDetail } from "@/types/content";

export function ProjectsPage({ projects }: { projects: ProjectDetail[] }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero eyebrow="Projects" title="项目作品集" />

      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>

      {projects.length === 0 ? (
        <Panel title="" description="">
          <div className="py-12 text-center">
            <p className="text-lg font-semibold text-slate-900">暂无项目</p>
            <p className="mt-2 text-sm text-slate-500">项目信息将在后续补充</p>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
