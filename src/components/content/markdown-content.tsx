import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function getImageWidth(title?: string | null) {
  const match = title?.match(/^width=(\d{1,3}%|\d{2,4}px)$/);
  if (!match) return undefined;

  const width = match[1];
  if (width.endsWith("%")) {
    const percent = Number.parseInt(width, 10);
    return percent >= 1 && percent <= 100 ? width : undefined;
  }

  const pixels = Number.parseInt(width, 10);
  return pixels >= 120 && pixels <= 1600 ? width : undefined;
}

function isSafeImageSource(src: string) {
  return (
    src.startsWith("/uploads/") ||
    src.startsWith("https://") ||
    src.startsWith("http://")
  );
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-slate-950">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-8 text-2xl font-semibold tracking-tight text-slate-900">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-6 text-xl font-semibold text-slate-900">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="mt-5 text-lg font-semibold text-slate-800">
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="my-4 text-base leading-8 text-slate-700">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="my-4 list-disc space-y-2 pl-6 text-slate-700">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="my-4 list-decimal space-y-2 pl-6 text-slate-700">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="my-5 border-l-4 border-emerald-500/60 bg-emerald-50 px-5 py-3 text-slate-700 italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-8 border-slate-200" />,
        a: ({ href, children }) => {
          const external =
            href?.startsWith("http://") || href?.startsWith("https://");
          return (
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-900"
            >
              {children}
            </a>
          );
        },
        img: ({ src, alt, title }) => {
          if (typeof src !== "string" || !isSafeImageSource(src)) return null;
          const width = getImageWidth(title);
          return (
            <figure className="my-6 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <img
                src={src}
                alt={alt ?? ""}
                style={width ? { width, maxWidth: "100%" } : undefined}
                className="mx-auto h-auto max-h-[680px] object-contain"
              />
              {alt ? (
                <figcaption className="px-4 py-2 text-center text-xs text-slate-500">
                  {alt}
                </figcaption>
              ) : null}
            </figure>
          );
        },
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-slate-50 text-slate-800">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-4 py-3 font-semibold">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border-t border-slate-100 px-4 py-3 text-slate-700">
            {children}
          </td>
        ),
        pre: ({ children }) => (
          <pre className="my-6 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
            {children}
          </pre>
        ),
        code: ({ className, children }) => (
          <code
            className={
              className
                ? `${className} font-mono`
                : "rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-rose-700"
            }
          >
            {children}
          </code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
