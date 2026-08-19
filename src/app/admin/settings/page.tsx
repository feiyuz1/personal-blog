import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AdminSettingsPage as AdminSettingsClient } from "@/modules/admin/admin-settings-page";

/**
 * 系统设置页（服务端组件）。
 * 服务端读取 site_settings 表首条记录传入客户端组件；
 * 若无记录则传 null，客户端展示空表单，保存时由 PUT 接口自动创建。
 */
export default async function AdminSettingsPage() {
  await requireAdmin();

  const settings = await prisma.siteSetting.findFirst();

  // BigInt 序列化为字符串，便于传给客户端组件
  const initialSettings = settings
    ? {
        id: String(settings.id),
        siteTitle: settings.siteTitle,
        siteSubtitle: settings.siteSubtitle,
        logoUrl: settings.logoUrl,
        footerText: settings.footerText,
        seoTitle: settings.seoTitle,
        seoDescription: settings.seoDescription,
        seoKeywords: settings.seoKeywords,
        socialLinks: settings.socialLinks,
      }
    : null;

  return <AdminSettingsClient initialSettings={initialSettings} />;
}
