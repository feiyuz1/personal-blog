"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MascotRoot } from "../components/MascotRoot";
import type {
  MascotFeatureConfig,
  MascotHostContext,
  MascotPageType,
} from "../core/types";

function pageType(pathname: string): MascotPageType {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/posts/")) return "article";
  if (pathname.startsWith("/projects/")) return "project";
  return "other";
}

function pathIdentifier(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const value = parts.at(-1);
  if (!value) return undefined;
  try {
    return decodeURIComponent(value).slice(0, 128);
  } catch {
    return value.slice(0, 128);
  }
}

export function BlogMascotHost({
  hostContext,
  features,
}: {
  hostContext: MascotHostContext;
  features: MascotFeatureConfig;
}) {
  const pathname = usePathname() || "/";
  const [title, setTitle] = useState<string>();

  useEffect(() => {
    const updateTitle = () => {
      const value = document.title.split("|")[0]?.trim();
      setTitle(value || undefined);
    };
    updateTitle();
    const titleElement = document.querySelector("title");
    const observer = new MutationObserver(updateTitle);
    if (titleElement) observer.observe(titleElement, { childList: true });
    return () => observer.disconnect();
  }, [pathname]);

  const currentContext = useMemo<MascotHostContext>(
    () => ({
      ...hostContext,
      page: {
        pathname,
        title,
        type: pageType(pathname),
        articleId:
          pathname.startsWith("/posts/") || pathname.startsWith("/projects/")
            ? pathIdentifier(pathname)
            : undefined,
      },
    }),
    [hostContext, pathname, title],
  );

  return <MascotRoot hostContext={currentContext} features={features} />;
}
