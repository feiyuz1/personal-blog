"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AdminPostEditorPage } from "@/modules/admin/admin-post-editor";

function PostEditorContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action") ?? "new";
  const editId = searchParams.get("id") ?? undefined;

  if (action === "edit" && editId) {
    return <AdminPostEditorPage editId={editId} />;
  }

  return <AdminPostEditorPage />;
}

export function AdminPostActionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">加载编辑器...</div>}>
      <PostEditorContent />
    </Suspense>
  );
}
