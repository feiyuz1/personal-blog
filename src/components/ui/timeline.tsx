import type { TimelineItem } from "@/types/content";

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative space-y-0">
      {/* 竖线 */}
      <div className="absolute left-6 top-2 h-[calc(100%-1rem)] w-px bg-emerald-200" />

      {items.map((item) => (
        <div key={item.period} className="relative flex gap-6 pb-10 last:pb-0">
          {/* 圆点 */}
          <div className="relative z-10 mt-2.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-emerald-600 bg-white" />

          {/* 内容 */}
          <div className="min-w-0 flex-1 rounded-[1.25rem] border border-black/5 bg-white/80 p-5 shadow-[0_14px_34px_rgba(34,58,45,0.05)]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold tracking-wide text-emerald-700">
                {item.period}
              </span>
              {item.tag ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  {item.tag}
                </span>
              ) : null}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
