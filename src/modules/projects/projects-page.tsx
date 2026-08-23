import Link from "next/link";

import { ProjectCard } from "@/components/content/project-card";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import type { ProjectDetail } from "@/types/content";

export function ProjectsPage({ projects }: { projects: ProjectDetail[] }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero
        eyebrow="Projects"
        title="项目作品集"
        description="这里记录 C++、图形学与 Unreal Engine 方向的项目和练习。点击卡片的图片或视频可放大查看，进入详情页还能看到技术栈、职责与阶段总结。"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>

      {projects.length === 0 ? (
        <Panel title="" description="">
          <div className="py-12 text-center">
            <p className="text-lg font-semibold text-slate-900">暂无项目</p>
            <p className="mt-2 text-sm text-slate-500">项目信息将在后续补充</p>
          </div>
        </Panel>
      ) : null}

      <Panel title="关于项目展示" description="">
        <div className="space-y-3 text-sm leading-7 text-slate-600">
          <p>
            项目状态分为：{" "}
            <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Online
            </span>{" "}
            已上线、{" "}
            <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              Building
            </span>{" "}
            开发中、{" "}
            <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              Planning
            </span>{" "}
            规划中。
          </p>
          <p>
            如果你对某个项目的技术选型或实现细节感兴趣，欢迎通过{" "}
            <Link
              href="/contact"
              className="font-medium text-emerald-800 hover:underline"
            >
              联系方式
            </Link>{" "}
            与我交流。
          </p>
        </div>
      </Panel>
    </div>
  );
}
