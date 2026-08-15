import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => (
      <h1
        className="mt-8 text-4xl font-semibold tracking-tight text-slate-900"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        className="mt-8 text-2xl font-semibold tracking-tight text-slate-900"
        {...props}
      />
    ),
    p: (props) => (
      <p className="mt-4 text-base leading-8 text-slate-700" {...props} />
    ),
    a: (props) => (
      <a className="font-medium text-emerald-800 underline" {...props} />
    ),
    pre: (props) => (
      <pre
        className="mt-6 overflow-x-auto rounded-3xl bg-slate-950 p-5 text-sm text-slate-100"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.92em]"
        {...props}
      />
    ),
    ...components,
  };
}
