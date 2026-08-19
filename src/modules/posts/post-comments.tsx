"use client";

import { useState, useEffect } from "react";

import { Panel } from "@/components/ui/panel";

// 评论节点结构（与 GET /api/comments 返回一致）
interface CommentNode {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
  children: CommentNode[];
}

/**
 * 文章评论区（客户端组件）。
 *
 * 职责：
 *  - 展示已通过审核的评论（支持嵌套回复展示）；
 *  - 提供评论提交表单（昵称、邮箱可选、内容）；
 *  - 支持对某条评论进行回复（设置 parentId）；
 *  - 提交后提示"待审核"，不立即展示。
 */
export function PostComments({
  postId,
  initialComments,
}: {
  postId: string;
  initialComments: CommentNode[];
}) {
  const [comments, setComments] = useState<CommentNode[]>(initialComments);
  // 回复目标：null 表示顶层评论，否则为被回复评论的 id
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // 表单字段
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 切换回复目标时清空内容
  useEffect(() => {
    setContent("");
  }, [replyTo]);

  // 提交评论
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (!nickname.trim() || !content.trim()) {
      setMessage({ type: "error", text: "昵称和评论内容不能为空" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          parentId: replyTo,
          nickname: nickname.trim(),
          email: email.trim() || undefined,
          content: content.trim(),
        }),
      });
      const json = (await res.json()) as { code: number; message?: string };
      if (json.code !== 0) {
        setMessage({ type: "error", text: json.message ?? "提交失败" });
      } else {
        setMessage({ type: "success", text: "评论已提交，审核通过后将展示。" });
        setContent("");
        // 顶层评论提交后退出回复模式
        if (replyTo) setReplyTo(null);
      }
    } catch {
      setMessage({ type: "error", text: "网络错误，提交失败" });
    } finally {
      setSubmitting(false);
    }
  }

  // 渲染单条评论及其子评论（递归）
  function renderComment(node: CommentNode, depth: number): React.ReactNode {
    return (
      <div key={node.id} className={depth > 0 ? "ml-6 border-l border-slate-100 pl-4" : ""}>
        <div className="rounded-2xl border border-black/5 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">{node.nickname}</span>
            <span className="text-xs text-slate-400">{node.createdAt}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {node.content}
          </p>
          {/* 回复按钮：仅顶层评论下显示，避免无限层级嵌套 */}
          {depth < 2 ? (
            <button
              type="button"
              onClick={() => setReplyTo(node.id)}
              className="mt-2 text-xs font-medium text-emerald-700 hover:underline"
            >
              回复
            </button>
          ) : null}
        </div>
        {/* 子评论递归渲染 */}
        {node.children.length > 0 ? (
          <div className="mt-3 space-y-3">
            {node.children.map((child) => renderComment(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  }

  // 统计评论总数（含子评论）
  function countComments(nodes: CommentNode[]): number {
    return nodes.reduce((sum, n) => sum + 1 + countComments(n.children), 0);
  }
  const total = countComments(comments);

  return (
    <Panel title={`评论 ${total > 0 ? `(${total})` : ""}`} description="参与讨论，分享你的看法。评论审核通过后展示。">
      {/* 评论列表 */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((node) => renderComment(node, 0))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-400">
          暂无评论，来抢沙发吧。
        </p>
      )}

      {/* 回复提示 */}
      {replyTo ? (
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-500">
          <span>正在回复评论</span>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="text-slate-500 hover:text-slate-800"
          >
            取消回复
          </button>
        </div>
      ) : null}

      {/* 评论表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">昵称 *</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={50}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">邮箱（可选）</span>
            <input
              type="email"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={191}
            />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">评论内容 *</span>
          <textarea
            className="min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-600 focus:outline-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            required
          />
        </label>

        {message ? (
          <p className={`text-xs ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>
            {message.text}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "提交中..." : "提交评论"}
        </button>
      </form>
    </Panel>
  );
}
