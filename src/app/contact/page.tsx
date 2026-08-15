import { SiteShell } from "@/components/site/site-shell";
import { ContactPage } from "@/modules/profile/contact-page";
import { getContactChannels, getSiteConfig } from "@/services/content-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "联系我",
  description:
    "通过邮箱、GitHub 或留言板与 Feiyuz 取得联系。技术咨询、合作邀约或技术交流都欢迎。",
};

export default async function ContactRoute() {
  const [config, channels] = await Promise.all([
    getSiteConfig(),
    getContactChannels(),
  ]);

  return (
    <SiteShell config={config}>
      <ContactPage channels={channels} />
    </SiteShell>
  );
}
