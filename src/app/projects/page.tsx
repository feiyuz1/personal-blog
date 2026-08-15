import { SiteShell } from "@/components/site/site-shell";
import { ProjectsPage } from "@/modules/projects/projects-page";
import { getSiteConfig, listProjects } from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "项目展示",
  description:
    "Feiyuz 的项目作品集，涵盖全栈开发、工具链和设计系统。每个项目包含技术栈说明、职责描述和阶段总结。",
};

export default async function ProjectsRoute() {
  const [config, projects] = await Promise.all([
    getSiteConfig(),
    listProjects(),
  ]);

  return (
    <SiteShell config={config}>
      <ProjectsPage projects={projects} />
    </SiteShell>
  );
}
