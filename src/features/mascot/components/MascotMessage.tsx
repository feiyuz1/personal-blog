import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

export type DisplayMascotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
};

export function MascotMessage({
  mascotName,
  message,
  pending,
  streaming,
}: {
  mascotName: string;
  message: DisplayMascotMessage;
  pending?: boolean;
  streaming?: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="ml-auto max-w-[84%]">
        <p className="mb-1 text-right text-[11px] font-medium text-slate-400">
          你
        </p>
        <div className="rounded-2xl rounded-br-md bg-emerald-700 px-3.5 py-2.5 text-sm leading-6 break-words whitespace-pre-wrap text-white shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="mr-auto max-w-[92%] min-w-0">
      <p className="mb-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
        {mascotName}
      </p>
      <div
        className={`min-w-0 overflow-hidden rounded-2xl rounded-bl-md border px-3.5 py-2.5 text-sm leading-6 shadow-sm ${
          message.error
            ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-200"
            : "border-emerald-950/10 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
        }`}
      >
        {message.content ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              p: ({ children }) => (
                <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
              ),
              li: ({ children }) => <li className="pl-0.5">{children}</li>,
              h1: ({ children }) => (
                <h1 className="mt-2 mb-1 text-base font-semibold">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mt-2 mb-1 text-sm font-semibold">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-2 mb-1 text-sm font-semibold">{children}</h3>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-2 border-l-2 border-emerald-500 pl-3 text-slate-500 italic dark:text-slate-300">
                  {children}
                </blockquote>
              ),
              pre: ({ children }) => (
                <pre className="my-2 max-w-full overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                  {children}
                </pre>
              ),
              code: ({ className, children }) => (
                <code
                  className={
                    className
                      ? `${className} font-mono`
                      : "rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-rose-700 dark:bg-slate-700 dark:text-rose-200"
                  }
                >
                  {children}
                </code>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900 dark:text-emerald-300"
                >
                  {children}
                </a>
              ),
              img: () => null,
              table: ({ children }) => (
                <div className="my-2 overflow-x-auto">
                  <table className="min-w-full border-collapse text-xs">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left dark:border-slate-600 dark:bg-slate-700">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-slate-200 px-2 py-1 dark:border-slate-600">
                  {children}
                </td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : pending ? (
          <span
            className="inline-flex items-center gap-1 text-slate-400"
            role="status"
          >
            <span className="size-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.2s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.1s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-emerald-500" />
            <span className="sr-only">{mascotName}正在思考</span>
          </span>
        ) : (
          <span className="text-rose-700 dark:text-rose-200">
            请求已中断，请重新发送。
          </span>
        )}
        {streaming && message.content ? (
          <span
            className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-emerald-600 align-middle"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </div>
  );
}
