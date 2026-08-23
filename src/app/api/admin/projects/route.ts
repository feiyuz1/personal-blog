import { badRequest, forbidden, ok, unauthorized } from "@/lib/api-response";
import { getAdminSession } from "@/lib/auth/session";
import { parseProjectInput } from "@/lib/project-input";
import { verifySameOrigin } from "@/lib/request-origin";
import { createProject, listAllProjects } from "@/services/admin-service";

/** GET /api/admin/projects - 后台项目列表。 */
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") ?? "20", 10);
    const result = await listAllProjects({
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 20,
      keyword: searchParams.get("keyword") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    return ok(result);
  } catch (error) {
    console.error("Admin projects GET error:", error);
    return badRequest("读取项目列表失败");
  }
}

/** POST /api/admin/projects - 创建项目。 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  if (!verifySameOrigin(request)) return forbidden("来源校验失败");

  try {
    const parsed = parseProjectInput(await request.json());
    if ("error" in parsed) return badRequest(parsed.error);

    const project = await createProject(parsed.input);
    return ok(project, "项目已创建");
  } catch (error) {
    const cause = error as { code?: string };
    if (cause.code === "P2002") return badRequest("该项目 Slug 已存在，请更换");
    console.error("Admin projects POST error:", error);
    return badRequest("创建项目失败");
  }
}
