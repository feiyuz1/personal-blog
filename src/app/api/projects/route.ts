import { ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

/** GET /api/projects - 获取项目列表 */
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return ok(
      projects.map((p) => ({
        id: String(p.id),
        name: p.name,
        slug: p.slug,
        summary: p.summary,
        techStack: p.techStack ? JSON.parse(p.techStack) : [],
        status: p.status.toLowerCase(),
        role: p.role ?? "",
        highlights: (p.highlights as string[]) ?? [],
        milestones: (p.milestones as string[]) ?? [],
        articleSlug: p.articleSlug ?? undefined,
        repositoryUrl: p.githubUrl ?? undefined,
        previewUrl: p.projectUrl ?? undefined,
      }))
    );
  } catch (error) {
    console.error("Projects error:", error);
    return ok([]);
  }
}
