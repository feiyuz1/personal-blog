import { NextRequest } from "next/server";

import {
  badRequest,
  forbidden,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api-response";
import { getAdminSession } from "@/lib/auth/session";
import { parseProjectInput } from "@/lib/project-input";
import { verifySameOrigin } from "@/lib/request-origin";
import {
  deleteProject,
  getProjectById,
  updateProject,
} from "@/services/admin-service";

function toProjectId(id: string): bigint | null {
  try {
    const value = BigInt(id);
    return value > BigInt(0) ? value : null;
  } catch {
    return null;
  }
}

/** GET /api/admin/projects/[id] - 读取一个项目。 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return unauthorized();

  const id = toProjectId((await params).id);
  if (!id) return badRequest("项目 ID 不合法");

  const project = await getProjectById(id);
  return project ? ok(project) : notFound("项目不存在");
}

/** PUT /api/admin/projects/[id] - 更新项目。 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  if (!verifySameOrigin(request)) return forbidden("来源校验失败");

  const id = toProjectId((await params).id);
  if (!id) return badRequest("项目 ID 不合法");

  try {
    const parsed = parseProjectInput(await request.json());
    if ("error" in parsed) return badRequest(parsed.error);

    const project = await updateProject({ id, ...parsed.input });
    return ok(project, "项目已更新");
  } catch (error) {
    const cause = error as { code?: string };
    if (cause.code === "P2002") return badRequest("该项目 Slug 已存在，请更换");
    if (cause.code === "P2025") return notFound("项目不存在");
    console.error("Admin projects PUT error:", error);
    return badRequest("更新项目失败");
  }
}

/** DELETE /api/admin/projects/[id] - 删除项目记录（不会删除媒体库文件）。 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return unauthorized();
  if (!verifySameOrigin(request)) return forbidden("来源校验失败");

  const id = toProjectId((await params).id);
  if (!id) return badRequest("项目 ID 不合法");

  try {
    await deleteProject(id);
    return ok({ deleted: true }, "项目已删除");
  } catch (error) {
    const cause = error as { code?: string };
    if (cause.code === "P2025") return notFound("项目不存在");
    console.error("Admin projects DELETE error:", error);
    return badRequest("删除项目失败");
  }
}
