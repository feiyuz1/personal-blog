import { SiteShell } from "@/components/site/site-shell";
import { ProjectDetailPage } from "@/modules/projects/project-detail-page";
import { getProjectBySlug, getSiteConfig } from "@/services/content-service";
import { notFound } from "next/navigation";

export default async function ProjectDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [config, project] = await Promise.all([
    getSiteConfig(),
    getProjectBySlug(slug),
  ]);

  if (!project) notFound();

  return (
    <SiteShell config={config}>
      <ProjectDetailPage project={project} />
    </SiteShell>
  );
}
