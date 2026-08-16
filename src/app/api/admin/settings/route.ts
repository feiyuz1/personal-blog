import { Prisma } from "@prisma/client";

import { forbidden, ok, unauthorized } from "@/lib/api-response";
import { getAdminSession } from "@/lib/auth/session";
import { verifySameOrigin } from "@/lib/request-origin";
import { prisma } from "@/lib/prisma";

type SettingsBody = {
  siteTitle?: string;
  siteSubtitle?: string;
  logoUrl?: string;
  footerText?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  socialLinks?: Prisma.InputJsonValue | null;
};

function normalizeJsonInput(value: Prisma.InputJsonValue | null | undefined) {
  return value === null ? undefined : value;
}

/** GET /api/admin/settings - 获取站点设置 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }

  try {
    let settings = await prisma.siteSetting.findFirst();

    if (!settings) {
      settings = await prisma.siteSetting.create({
        data: {
          siteTitle: "Feiyuz Blog",
          siteSubtitle: "Full-stack development, writing, and project notes",
          seoTitle: "Feiyuz Blog - Full-stack development, writing, and project notes",
          seoDescription:
            "A personal blog for technical articles, project notes, and learning records.",
        },
      });
    }

    return ok(settings);
  } catch (error) {
    console.error("Settings GET error:", error);
    return ok(null, "Failed to load settings");
  }
}

/** PUT /api/admin/settings - 更新站点设置 */
export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorized();
  }

  if (!verifySameOrigin(request)) {
    return forbidden("来源校验失败");
  }

  try {
    let settings = await prisma.siteSetting.findFirst();
    const body = (await request.json()) as SettingsBody;
    const socialLinks = normalizeJsonInput(body.socialLinks);

    if (settings) {
      settings = await prisma.siteSetting.update({
        where: { id: settings.id },
        data: {
          siteTitle: body.siteTitle ?? undefined,
          siteSubtitle: body.siteSubtitle ?? undefined,
          logoUrl: body.logoUrl ?? undefined,
          footerText: body.footerText ?? undefined,
          seoTitle: body.seoTitle ?? undefined,
          seoDescription: body.seoDescription ?? undefined,
          seoKeywords: body.seoKeywords ?? undefined,
          socialLinks,
        },
      });
    } else {
      settings = await prisma.siteSetting.create({
        data: {
          siteTitle: body.siteTitle ?? null,
          siteSubtitle: body.siteSubtitle ?? null,
          logoUrl: body.logoUrl ?? null,
          footerText: body.footerText ?? null,
          seoTitle: body.seoTitle ?? null,
          seoDescription: body.seoDescription ?? null,
          seoKeywords: body.seoKeywords ?? null,
          socialLinks,
        },
      });
    }

    return ok(settings, "Settings updated");
  } catch (error) {
    console.error("Settings PUT error:", error);
    return ok(null, "Failed to save settings");
  }
}
