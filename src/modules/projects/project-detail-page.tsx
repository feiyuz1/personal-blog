import Link from "next/link";

/* 项目封面可使用管理员填写的受校验外部地址。 */
/* eslint-disable @next/next/no-img-element */

import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import type { ProjectDetail } from "@/types/content";

const statusLabel: Record<string, string> = {
  planning: "规划中",
  building: "开发中",
  online: "已上线",
};

const statusColor: Record<string, string> = {
  planning:
    "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600",
  building:
    "rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700",
  online:
    "rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700",
};

function isVideoUrl(url?: string) {
  return Boolean(url && /\.(mp4|webm)(?:[?#].*)?$/i.test(url));
}

export function ProjectDetailPage({
  project,
}: {
  project: ProjectDetail | null;
}) {
  if (!project) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-12 md:px-10">
        <EmptyState
          title="项目不存在"
          description="该项目可能已被移除或链接有误。返回项目列表查看其他项目。"
        />
        <div className="mt-6 text-center">
          <Link
            href="/projects"
            className="inline-block rounded-full border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
          >
            返回项目列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
      <PageHero
        eyebrow={statusLabel[project.status] || project.status}
        title={project.name}
        description={project.summary}
        aside={
          <div className="rounded-[1.5rem] bg-slate-950 p-6 text-slate-50">
            <p className="text-sm text-slate-300">我的角色</p>
            <p className="mt-2 text-lg font-semibold">{project.role}</p>

            <p className="mt-5 text-sm text-slate-300">技术栈</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <Pill key={tech} label={tech} variant="light" />
              ))}
            </div>

            <div className="mt-5">
              <span
                className={`inline-block ${statusColor[project.status] || statusColor.building}`}
              >
                {statusLabel[project.status] || project.status}
              </span>
            </div>
          </div>
        }
      />

      {project.coverUrl ? (
        <section className="overflow-hidden rounded-[1.5rem] border border-black/5 bg-slate-950 shadow-[0_18px_44px_rgba(34,58,45,0.06)]">
          {isVideoUrl(project.coverUrl) ? (
            <video
              src={project.coverUrl}
              className="max-h-[70vh] w-full object-contain"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={project.coverUrl}
              alt={`${project.name} 项目封面`}
              className="max-h-[70vh] w-full object-contain"
            />
          )}
        </section>
      ) : null}

      {/* 项目亮点 + 里程碑 */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Panel title="项目亮点" description="这个项目的核心价值和特色">
          <ul className="space-y-3 text-sm leading-7 text-slate-700">
            {project.highlights.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="里程碑" description="项目进展中的关键节点">
          <ul className="space-y-3 text-sm leading-7 text-slate-700">
            {project.milestones.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* 关联入口 */}
      {project.articleSlug || project.repositoryUrl || project.previewUrl ? (
        <Panel title="相关链接" description="快速跳转到关联资源。">
          <div className="flex flex-wrap gap-3 text-sm">
            {project.articleSlug ? (
              <Link
                href={`/posts/${project.articleSlug}`}
                className="rounded-full bg-slate-950 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
              >
                查看复盘文章
              </Link>
            ) : null}
            {project.repositoryUrl ? (
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                GitHub 仓库
              </a>
            ) : null}
            {project.previewUrl ? (
              <a
                href={project.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                在线预览
              </a>
            ) : null}
          </div>
        </Panel>
      ) : null}

      {/* 返回列表 */}
      <div className="text-center">
        <Link
          href="/projects"
          className="inline-block rounded-full border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
        >
          &larr; 返回项目列表
        </Link>
      </div>
    </article>
  );
}
