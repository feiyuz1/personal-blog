import { NextResponse } from "next/server";

import { ok } from "@/lib/api-response";
import { getPostBySlug } from "@/services/content-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return NextResponse.json(
      {
        code: 404,
        message: "post not found",
        data: null,
      },
      { status: 404 },
    );
  }

  return ok(post);
}
