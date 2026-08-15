import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <section className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/80 p-8 shadow-[0_18px_44px_rgba(34,58,45,0.06)] md:grid-cols-[1.4fr_0.8fr] md:p-10">
      <div className="space-y-4">
        <p className="text-sm font-semibold tracking-[0.28em] text-emerald-800/70 uppercase">
          {eyebrow}
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-8 text-slate-700 md:text-lg">
          {description}
        </p>
      </div>
      {aside ? <div>{aside}</div> : null}
    </section>
  );
}
