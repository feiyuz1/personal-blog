import { ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

/** GET /api/tags - 获取全部标签 */
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: { _count: { select: { postTags: true } } },
      orderBy: { name: "asc" },
    });

    return ok(
      tags.map((t) => ({
        name: t.name,
        slug: t.slug,
        count: t._count.postTags,
      }))
    );
  } catch (error) {
    console.error("Tags error:", error);
    return ok([]);
  }
}
