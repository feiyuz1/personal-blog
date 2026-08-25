import type { MascotPageContext } from "../core/types";

export function MascotSuggestions({
  page,
  disabled,
  onSelect,
}: {
  page?: MascotPageContext;
  disabled: boolean;
  onSelect: (prompt: string) => void;
}) {
  const prompts =
    page?.type === "article"
      ? ["总结这篇文章", "解释这篇文章的核心概念", "这篇文章适合什么基础的人？"]
      : ["介绍一下这个博客", "你是谁？", "什么是 Unreal Engine？"];

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3" aria-label="快捷问题">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-emerald-800/15 bg-emerald-50/70 px-3 py-1.5 text-xs text-emerald-900 transition outline-none hover:border-emerald-700/30 hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-300/20 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-900/60"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
