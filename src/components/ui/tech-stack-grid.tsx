import type { TechStackCategory } from "@/types/content";
import { Pill } from "./pill";

interface TechStackGridProps {
  categories: TechStackCategory[];
}

export function TechStackGrid({ categories }: TechStackGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {categories.map((group) => (
        <div
          key={group.category}
          className="rounded-[1.5rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_44px_rgba(34,58,45,0.06)]"
        >
          <h3 className="text-base font-semibold text-slate-900">
            {group.category}
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {group.items.map((tech) => (
              <Pill key={tech} label={tech} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
