"use client";

import { useEffect, useState } from "react";

/**
 * 代码块组件：通过 CDN 动态加载 highlight.js 进行语法高亮。
 *
 * 设计取舍：
 *  - 不将 highlight.js 打进依赖，避免安装时的权限/缓存问题，构建产物更小；
 *  - 脚本与主题样式在首次使用时按需从 CDN 加载，后续命中缓存；
 *  - 加载完成前以纯文本展示，加载失败也不影响阅读，保证可用性。
 *  - 若后续需要离线/自托管，可改为 npm 安装 highlight.js 并直接 import。
 */
const HLJS_CDN_BASE = "https://cdn.jsdelivr.net/npm/highlight.js@11.9.0";

// 全局只加载一次 highlight.js
let hljsPromise: Promise<void> | null = null;

function ensureHljs(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as unknown as { hljs?: unknown };
  if (w.hljs) return Promise.resolve();
  if (hljsPromise) return hljsPromise;

  hljsPromise = new Promise<void>((resolve, reject) => {
    // 主题样式：github-dark，与深色代码块背景搭配
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${HLJS_CDN_BASE}/styles/github-dark.min.css`;
    document.head.appendChild(link);

    // 高亮脚本
    const script = document.createElement("script");
    script.src = `${HLJS_CDN_BASE}/lib/highlight.min.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("highlight.js 加载失败"));
    document.head.appendChild(script);
  });

  return hljsPromise;
}

// 纯文本回退时需要对 HTML 特殊字符转义，避免把代码当成标签渲染
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  // 高亮后的 HTML；加载完成前为空，使用纯文本回退
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    ensureHljs()
      .then(() => {
        if (cancelled) return;
        const w = window as unknown as {
          hljs?: {
            highlight: (code: string, opts: { language: string }) => { value: string };
            highlightAuto: (code: string) => { value: string };
          };
        };
        const hljs = w.hljs;
        if (!hljs) return;
        // 指定语言则用 highlight，否则自动检测
        const result = language
          ? hljs.highlight(code, { language })
          : hljs.highlightAuto(code);
        setHighlightedHtml(result.value);
      })
      .catch(() => {
        // 加载失败保持纯文本，不影响阅读
      });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  return (
    <pre className="overflow-x-auto rounded-3xl bg-slate-950 p-5 text-sm leading-relaxed text-slate-100">
      <code
        className={`hljs${language ? ` language-${language}` : ""}`}
        dangerouslySetInnerHTML={
          highlightedHtml
            ? { __html: highlightedHtml }
            : { __html: escapeHtml(code) }
        }
      />
    </pre>
  );
}
