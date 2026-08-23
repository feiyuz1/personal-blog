import { ProjectStatus } from "@prisma/client";

import type { ProjectInput } from "@/services/admin-service";

const PROJECT_STATUSES = new Set(Object.values(ProjectStatus));
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function stringValue(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
) {
  const value = body[key];
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : null;
}

function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.map((item) =>
    typeof item === "string" ? item.trim() : "",
  );
  if (items.some((item) => !item || item.length > 500) || items.length > 50) {
    return null;
  }
  return items;
}

function validUrl(
  value: string,
  options: { allowLocalUpload?: boolean } = {},
): boolean {
  if (!value) return true;
  if (options.allowLocalUpload && value.startsWith("/uploads/")) {
    return !value.includes("..") && !value.includes("\\");
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** 将后台项目表单转换为可安全写入数据库的字段。 */
export function parseProjectInput(
  body: unknown,
): { input: ProjectInput } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "请求数据不合法" };
  }

  const values = body as Record<string, unknown>;
  const name = stringValue(values, "name", 150);
  const slug = stringValue(values, "slug", 150)?.toLowerCase();
  const summary = stringValue(values, "summary", 10_000);
  const coverUrl = stringValue(values, "coverUrl", 500);
  const role = stringValue(values, "role", 255);
  const articleSlug = stringValue(values, "articleSlug", 255);
  const githubUrl = stringValue(values, "githubUrl", 500);
  const projectUrl = stringValue(values, "projectUrl", 500);
  const techStack = stringList(values.techStack);
  const highlights = stringList(values.highlights);
  const milestones = stringList(values.milestones);
  const status = values.status;
  const sortOrder = Number(values.sortOrder ?? 0);

  if (!name || !slug || !SLUG_PATTERN.test(slug)) {
    return { error: "项目名称不能为空，Slug 只能使用小写字母、数字和连字符" };
  }
  if (
    summary === null ||
    coverUrl === null ||
    role === null ||
    articleSlug === null ||
    githubUrl === null ||
    projectUrl === null
  ) {
    return { error: "部分文本超出允许长度或格式不正确" };
  }
  if (!techStack || !highlights || !milestones) {
    return { error: "技术栈、项目亮点和里程碑须为非空文本列表" };
  }
  if (
    typeof status !== "string" ||
    !PROJECT_STATUSES.has(status as ProjectStatus)
  ) {
    return { error: "项目状态不合法" };
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 100_000) {
    return { error: "排序必须是 0 到 100000 之间的整数" };
  }
  if (!validUrl(coverUrl, { allowLocalUpload: true })) {
    return { error: "封面仅支持媒体库地址或 http(s) 图片/视频链接" };
  }
  if (!validUrl(githubUrl) || !validUrl(projectUrl)) {
    return { error: "项目链接仅支持 http(s) 地址" };
  }
  if (articleSlug && !SLUG_PATTERN.test(articleSlug)) {
    return { error: "关联文章 Slug 格式不正确" };
  }

  return {
    input: {
      name,
      slug,
      summary,
      coverUrl,
      techStack,
      status: status as ProjectStatus,
      role,
      highlights,
      milestones,
      articleSlug,
      githubUrl,
      projectUrl,
      sortOrder,
    },
  };
}
