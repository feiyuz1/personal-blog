import type { MascotHostContext, MascotPageContext } from "../core/types";

export function createServerHostContext(
  page?: MascotPageContext,
): MascotHostContext {
  return {
    site: {
      name: process.env.MASCOT_HOST_SITE_NAME?.trim() || "Feiyuz Blog",
      description:
        process.env.MASCOT_HOST_SITE_DESCRIPTION?.trim() ||
        "聚焦 C++、Unreal Engine、图形学、渲染与软件工程的个人技术博客。",
    },
    page,
  };
}
