import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Feiyuz Blog - 全栈开发、技术思考与项目沉淀",
    template: "%s | Feiyuz Blog",
  },
  description:
    "一个技术博主的内容输出空间，聚焦 Web 全栈开发、架构设计、工程实践与个人成长。基于 Next.js + TypeScript + Tailwind CSS 构建。",
  keywords: [
    "技术博客",
    "Next.js",
    "TypeScript",
    "全栈开发",
    "架构设计",
    "React",
    "前端",
    "后端",
  ],
  authors: [{ name: "Feiyuz", url: "/about" }],
  creator: "Feiyuz",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "Feiyuz Blog",
    title: "Feiyuz Blog - 全栈开发、技术思考与项目沉淀",
    description:
      "一个技术博主的内容输出空间，聚焦 Web 全栈开发、架构设计、工程实践与个人成长。",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@feiyuz",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
