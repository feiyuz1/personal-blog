import Link from "next/link";

import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import type { CategorySummary, TagSummary } from "@/types/content";

type TaxonomyIndexItem = CategorySummary | TagSummary;

export function TaxonomyIndexPage({
  title,
  description,
  eyebrow,
  basePath,
  items,
}: {
  title: string;
  description: string;
  eyebrow: string;
  basePath: string;
  items: TaxonomyIndexItem[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <Panel
        title="索引骨架"
        description="每个条目都会连接到对应聚合页，后续可以补筛选、排序和 SEO。"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`${basePath}/${item.slug}`}
              className="rounded-[1.5rem] border border-black/5 bg-slate-50 p-5 transition hover:border-slate-900/10 hover:bg-white"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.name}
                </h3>
                <span className="text-sm text-slate-500">{item.count}</span>
              </div>
              {"description" in item ? (
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.description}
                </p>
              ) : (
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  标签聚合页骨架，后续可接热度和相关推荐。
                </p>
              )}
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
