"use client";

/* 封面允许管理员填写受校验的外部地址，不能使用 next/image 的固定远程域名白名单。 */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";

import { Pill } from "@/components/ui/pill";
import type { ProjectSummary } from "@/types/content";

function isVideoUrl(url?: string) {
  return Boolean(url && /\.(mp4|webm)(?:[?#].*)?$/i.test(url));
}

export function ProjectCard({
  project,
}: {
  project: ProjectSummary & { highlights?: string[] };
}) {
  const [expanded, setExpanded] = useState(false);
  const hasVideo = isVideoUrl(project.coverUrl);

  useEffect(() => {
    if (!expanded) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [expanded]);

  return (
    <>
      <article className="flex h-full min-h-[390px] flex-col overflow-hidden rounded-[1.5rem] border border-black/5 bg-white/85 shadow-[0_18px_44px_rgba(34,58,45,0.06)]">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group relative block h-64 w-full shrink-0 overflow-hidden bg-slate-950 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          aria-label={`放大查看项目：${project.name}`}
        >
          {project.coverUrl ? (
            hasVideo ? (
              <video
                src={project.coverUrl}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={project.coverUrl}
                alt={`${project.name} 项目封面`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            )
          ) : (
            <div className="flex h-full items-end bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.42),transparent_42%),linear-gradient(135deg,#0f172a,#172554)] p-6">
              <span className="text-sm font-medium tracking-[0.2em] text-white/70 uppercase">
                Project
              </span>
            </div>
          )}
          <span className="absolute inset-0 bg-slate-950/0 transition group-hover:bg-slate-950/25" />
          <span className="absolute right-4 bottom-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-900 opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
            {hasVideo ? "播放并查看详情" : "放大查看详情"}
          </span>
        </button>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-semibold text-slate-900">
              <Link
                href={`/projects/${project.slug}`}
                className="transition hover:text-emerald-800"
              >
                {project.name}
              </Link>
            </h3>
            <Pill label={project.status} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {project.summary}
          </p>
          <div className="mt-auto pt-4">
            <div className="flex flex-wrap gap-2">
              {project.techStack.slice(0, 5).map((item) => (
                <Pill key={item} label={item} />
              ))}
            </div>
          </div>
        </div>
      </article>

      {expanded ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 md:p-8"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setExpanded(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`project-dialog-${project.id}`}
            className="max-h-full w-full max-w-5xl overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-6">
              <p className="text-sm font-medium text-slate-500">项目预览</p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                关闭
              </button>
            </div>
            <div className="grid md:grid-cols-[1.5fr_1fr]">
              <div className="min-h-60 bg-slate-950">
                {project.coverUrl ? (
                  hasVideo ? (
                    <video
                      src={project.coverUrl}
                      className="h-full max-h-[70vh] w-full object-contain"
                      controls
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={project.coverUrl}
                      alt={`${project.name} 项目封面`}
                      className="h-full max-h-[70vh] w-full object-contain"
                    />
                  )
                ) : (
                  <div className="flex min-h-60 items-center justify-center bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.42),transparent_42%),linear-gradient(135deg,#0f172a,#172554)] text-sm font-medium tracking-[0.2em] text-white/70 uppercase">
                    Project
                  </div>
                )}
              </div>
              <div className="space-y-5 p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2
                    id={`project-dialog-${project.id}`}
                    className="text-2xl font-semibold tracking-tight text-slate-900"
                  >
                    {project.name}
                  </h2>
                  <Pill label={project.status} />
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  {project.summary}
                </p>
                {project.role ? (
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
                      我的角色
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {project.role}
                    </p>
                  </div>
                ) : null}
                {project.highlights?.length ? (
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
                      项目亮点
                    </p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                      {project.highlights.slice(0, 4).map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((item) => (
                    <Pill key={item} label={item} />
                  ))}
                </div>
                <Link
                  href={`/projects/${project.slug}`}
                  onClick={() => setExpanded(false)}
                  className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
                >
                  查看完整详情
                </Link>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
