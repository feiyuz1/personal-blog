import { NextRequest } from "next/server";

import { notFound, ok } from "@/lib/api-response";
import { deletePost, getPostById, updatePost } from "@/services/admin-service";

async function readPostRecord(id: string) {
  const post = await getPostById(BigInt(id));

  if (!post) {
    return null;
  }

  return {
    title: post.title,
    slug: post.slug,
    summary: post.summary ?? "",
    content: post.content,
    readingTime: post.readingTime ?? "5 min",
    categoryId: post.categoryId ? String(post.categoryId) : null,
    isTop: post.isTop,
    status: post.status,
    tagSlugs: post.postTags.map((item) => item.tag.slug),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const post = await readPostRecord(id);

    if (!post) {
      return notFound("文章不存在");
    }

    return ok(post);
  } catch (error) {
    console.error("Get post error:", error);
    return notFound("文章不存在");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      slug,
      summary,
      content,
      readingTime,
      categoryId,
      isTop,
      status,
      tagSlugs,
    } = body as {
      title?: string;
      slug?: string;
      summary?: string;
      content?: string;
      readingTime?: string;
      categoryId?: number;
      isTop?: boolean;
      status?: "DRAFT" | "PUBLISHED" | "OFFLINE";
      tagSlugs?: string[];
    };

    const updated = await updatePost({
      id: BigInt(id),
      title,
      slug,
      summary,
      content,
      readingTime,
      categoryId,
      isTop,
      status,
      tagSlugs,
    });

    return ok(updated);
  } catch (error) {
    console.error("Update post error:", error);
    return notFound("文章不存在");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deletePost(BigInt(id));
    return ok({ deleted: true }, "文章已删除");
  } catch (error) {
    console.error("Delete post error:", error);
    return notFound("文章不存在");
  }
}
