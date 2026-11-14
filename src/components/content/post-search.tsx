"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";

import type { ApiResponse } from "@/types/api";
import type { PostSummary } from "@/types/content";

type TitleMatch = Pick<PostSummary, "title" | "slug">;
type Suggestions = {
  query: string;
  titles: TitleMatch[];
  failed?: boolean;
};

export function PostSearch({
  action,
  keyword,
}: {
  action: "/" | "/blog";
  keyword: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const [input, setInput] = useState(keyword);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions>();
  const query = input.trim();
  const suggestionQuery = open && query !== keyword ? query : "";
  const matches = suggestions?.query === suggestionQuery ? suggestions : null;

  useEffect(() => {
    if (!suggestionQuery) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      keyword: suggestionQuery,
      scope: "title",
    });
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Title search failed");

        const { data }: ApiResponse<{ list: TitleMatch[] }> =
          await response.json();
        if (!controller.signal.aborted) {
          setSuggestions({ query: suggestionQuery, titles: data.list });
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions({ query: suggestionQuery, titles: [], failed: true });
        }
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [suggestionQuery]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query) return;

    setOpen(false);
    setInput(query);
    if (query !== keyword) {
      router.push(`${action}?keyword=${encodeURIComponent(query)}`, {
        scroll: false,
      });
    }
  }

  return (
    <form
      action={action}
      role="search"
      aria-label="搜索文章"
      className="relative z-10 w-full max-w-2xl"
      onSubmit={submit}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
        }
      }}
    >
      <div className="flex gap-2 sm:gap-3">
        <label htmlFor={inputId} className="sr-only">
          搜索文章
        </label>
        <input
          id={inputId}
          type="search"
          name="keyword"
          placeholder="搜索文章关键词"
          autoComplete="off"
          value={input}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setInput(event.target.value);
            setOpen(true);
          }}
          className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!query}
          className="shrink-0 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-default disabled:bg-slate-200 disabled:text-slate-600"
        >
          搜索
        </button>
      </div>

      {suggestionQuery && matches && (
        <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          {matches.titles.length ? (
            <ul aria-label="匹配标题">
              {matches.titles.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/posts/${encodeURIComponent(post.slug)}`}
                    className="block rounded-xl px-3 py-2 text-sm wrap-anywhere text-slate-800 hover:bg-emerald-50 focus-visible:bg-emerald-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-700"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="px-3 py-2 text-sm text-slate-600">
              {matches.failed ? "暂时无法加载匹配标题。" : "未找到匹配标题。"}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
