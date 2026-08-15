import { compare } from "bcryptjs";
import { CommentStatus, PostStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AdminOverview } from "@/types/content";

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    username: string;
    nickname: string;
    role: string;
  };
  error?: string;
}

type AdminPostRecord = Prisma.PostGetPayload<{
  include: {
    category: true;
    postTags: {
      include: {
        tag: true;
      };
    };
    author: {
      select: {
        nickname: true;
        username: true;
      };
    };
  };
}>;

const POST_STATUS_VALUES = new Set([
  "DRAFT",
  "PUBLISHED",
  "OFFLINE",
]);

const COMMENT_STATUS_VALUES = new Set([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

function normalizePostStatus(status?: string): PostStatus | undefined {
  if (!status || status === "all" || !POST_STATUS_VALUES.has(status)) {
    return undefined;
  }
  return status as PostStatus;
}

function normalizeCommentStatus(status?: string): CommentStatus | undefined {
  if (
    !status ||
    status === "all" ||
    !COMMENT_STATUS_VALUES.has(status)
  ) {
    return undefined;
  }
  return status as CommentStatus;
}

function toAdminPostRecord(post: AdminPostRecord) {
  return {
    ...post,
    id: String(post.id),
  };
}

export async function loginAdmin(username: string, password: string): Promise<LoginResult> {
  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return { success: false, error: "用户名或密码错误" };
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      return { success: false, error: "用户名或密码错误" };
    }

    return {
      success: true,
      user: {
        id: String(user.id),
        username: user.username,
        nickname: user.nickname ?? user.username,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("[admin-service] login failed:", error);
    return { success: false, error: "数据库不可用" };
  }
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [publishedCount, draftCount, commentPendingCount, projectCount] =
    await Promise.all([
      prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      prisma.post.count({ where: { status: PostStatus.DRAFT } }),
      prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
      prisma.project.count(),
    ]);

  const draftPosts = await prisma.post.findMany({
    where: { status: PostStatus.DRAFT },
    take: 3,
    orderBy: { updatedAt: "desc" },
    select: { title: true, slug: true, summary: true },
  });

  const commentQueue = await prisma.comment.findMany({
    where: { status: CommentStatus.PENDING },
    take: 4,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      post: { select: { title: true } },
      nickname: true,
      content: true,
    },
  });

  return {
    metrics: [
      { label: "已发布文章", value: String(publishedCount), trend: "实时统计" },
      { label: "草稿数量", value: String(draftCount), trend: "" },
      { label: "待审核评论", value: String(commentPendingCount), trend: "" },
      { label: "项目条目", value: String(projectCount), trend: "" },
    ],
    draftPosts: draftPosts.map((post) => ({
      title: post.title,
      slug: post.slug,
      summary: post.summary ?? "",
    })),
    commentQueue: commentQueue.map((comment) => ({
      id: String(comment.id),
      postTitle: comment.post.title,
      author: comment.nickname,
      excerpt: comment.content.slice(0, 80),
      status: "pending" as const,
    })),
    quickActions: [
      {
        label: "新建文章",
        href: "/admin/posts?action=new",
        description: "创建新文章，支持 Markdown 编辑器。",
      },
      {
        label: "审核评论",
        href: "/admin/comments",
        description: "查看待审核评论队列。",
      },
      {
        label: "站点配置",
        href: "/admin/settings",
        description: "修改站点标题、描述和社交链接。",
      },
      {
        label: "媒体管理",
        href: "/admin/media",
        description: "上传和管理图片等媒体文件。",
      },
    ],
  };
}

interface CreatePostInput {
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  readingTime?: string;
  categoryId?: number | bigint;
  isTop?: boolean;
  tagSlugs?: string[];
}

export async function createPost(input: CreatePostInput & { authorId: bigint }) {
  const { tagSlugs, ...data } = input;

  return prisma.post.create({
    data: {
      title: data.title,
      slug: data.slug,
      summary: data.summary ?? null,
      content: data.content ?? "",
      readingTime: data.readingTime ?? null,
      categoryId: data.categoryId ? BigInt(data.categoryId) : null,
      authorId: data.authorId,
      isTop: data.isTop ?? false,
      status: PostStatus.DRAFT,
      publishedAt: null,
      ...(tagSlugs && {
        postTags: {
          create: tagSlugs.map((slug) => ({
            tag: { connect: { slug } },
          })),
        },
      }),
    },
  });
}

interface UpdatePostInput extends Partial<CreatePostInput> {
  id: bigint;
  status?: PostStatus;
}

export async function updatePost(input: UpdatePostInput) {
  const { id, tagSlugs, status, ...rest } = input;

  let tagsOperation: Record<string, unknown> = {};
  if (tagSlugs !== undefined) {
    await prisma.postTag.deleteMany({ where: { postId: id } });
    tagsOperation = {
      postTags: {
        create: tagSlugs.map((slug) => ({
          tag: { connect: { slug } },
        })),
      },
    };
  }

  let publishedAtValue: Date | undefined;
  if (status === PostStatus.PUBLISHED) {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    if (!existing?.publishedAt) {
      publishedAtValue = new Date();
    }
  }

  return prisma.post.update({
    where: { id },
    data: {
      ...(rest.title !== undefined && { title: rest.title }),
      ...(rest.slug !== undefined && { slug: rest.slug }),
      ...(rest.summary !== undefined && { summary: rest.summary }),
      ...(rest.content !== undefined && { content: rest.content }),
      ...(rest.readingTime !== undefined && { readingTime: rest.readingTime }),
      ...(rest.categoryId !== undefined && {
        categoryId: rest.categoryId ? BigInt(rest.categoryId) : null,
      }),
      ...(rest.isTop !== undefined && { isTop: rest.isTop }),
      ...(status !== undefined && { status }),
      ...(publishedAtValue && { publishedAt: publishedAtValue }),
      ...tagsOperation,
    },
  });
}

export async function deletePost(id: bigint) {
  return prisma.post.delete({ where: { id } });
}

export async function getPostById(id: bigint) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: true,
      postTags: { include: { tag: true } },
      author: {
        select: {
          nickname: true,
          username: true,
        },
      },
    },
  });

  return post ? toAdminPostRecord(post) : null;
}

export async function listAllPosts(options?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const status = normalizePostStatus(options?.status);

  const where: Prisma.PostWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (options?.keyword) {
    where.OR = [
      { title: { contains: options.keyword, mode: "insensitive" } },
      { slug: { contains: options.keyword, mode: "insensitive" } },
      { summary: { contains: options.keyword, mode: "insensitive" } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        postTags: { include: { tag: true } },
        author: { select: { nickname: true, username: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function listAllCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
}) {
  return prisma.category.create({ data });
}

export async function updateCategory(
  id: bigint,
  data: { name?: string; description?: string },
) {
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: bigint) {
  return prisma.category.delete({ where: { id } });
}

export async function listAllTags() {
  return prisma.tag.findMany({
    include: { _count: { select: { postTags: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createTag(data: { name: string; slug: string }) {
  return prisma.tag.create({ data });
}

export async function deleteTag(id: bigint) {
  return prisma.tag.delete({ where: { id } });
}

export async function listAllComments(options?: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const status = normalizeCommentStatus(options?.status);

  const where: Prisma.CommentWhereInput = {};
  if (status) {
    where.status = status;
  }

  const [list, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { post: { select: { title: true, slug: true } } },
    }),
    prisma.comment.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function reviewComment(
  id: bigint,
  action: "approve" | "reject" | "delete",
) {
  switch (action) {
    case "approve":
      return prisma.comment.update({ where: { id }, data: { status: CommentStatus.APPROVED } });
    case "reject":
      return prisma.comment.update({ where: { id }, data: { status: CommentStatus.REJECTED } });
    case "delete":
      return prisma.comment.delete({ where: { id } });
  }
}
