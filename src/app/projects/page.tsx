import { SiteShell } from "@/components/site/site-shell";
import { ProjectsPage } from "@/modules/projects/projects-page";
import { getSiteConfig, listProjects } from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "项目展示",
  description:
    "Feiyuz 的 C++、图形学与 Unreal Engine 项目作品集。每个项目包含媒体展示、技术栈、职责描述和阶段总结。",
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
