import type { AboutSection, ContactChannel, SiteConfig } from "@/types/content";

export const siteConfig: SiteConfig = {
  title: "Feiyuz Blog",
  subtitle: "全栈开发、技术思考与项目沉淀",
  description:
    "一个技术博主的内容输出空间，聚焦 Web 全栈开发、架构设计、工程实践与个人成长。用代码记录思考，用文字沉淀知识。",
  heroLabel: "Tech Blog",
  navItems: [
    { label: "首页", href: "/", description: "回到博客首页" },
    { label: "博客", href: "/blog", description: "浏览全部文章" },
    { label: "分类", href: "/categories", description: "按分类查看" },
    { label: "归档", href: "/archive", description: "按时间归档" },
    { label: "项目", href: "/projects", description: "项目作品集" },
    { label: "关于我", href: "/about", description: "了解更多" },
    { label: "联系我", href: "/contact", description: "取得联系" },
  ],
  footerLinks: [
    { label: "GitHub", href: "https://github.com/", description: "我的 GitHub 主页" },
    { label: "RSS 订阅", href: "/api/rss", description: "RSS 源" },
    { label: "后台入口", href: "/admin", description: "管理后台" },
  ],
  stats: [
    { label: "文章", value: "10+", hint: "持续更新中" },
    { label: "项目", value: "4", hint: "涵盖多个领域" },
    { label: "分类", value: "5", hint: "内容体系化组织" },
    { label: "标签", value: "12+", hint: "多维度索引" },
  ],
};

export const profileInfo = {
  name: "Feiyuz",
  title: "全栈开发者 & 技术写作者",
  avatar: "/avatar.png",
  bio: "热爱用代码解决问题，也喜欢用文字记录思考。专注于 Web 全栈开发、系统设计和工程实践。相信好的代码和好的文字一样，都需要反复打磨。",
  location: "中国",
  experience: "5+ 年",
  education: "计算机科学与技术 · 本科",
};

export const techStacks = [
  {
    category: "前端核心",
    items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "MDX"],
  },
  {
    category: "后端与数据",
    items: ["Node.js", "Prisma", "PostgreSQL", "REST API", "GraphQL"],
  },
  {
    category: "DevOps 与工具",
    items: ["Docker", "Git", "Nginx", "Linux", "CI/CD"],
  },
  {
    category: "其他技能",
    items: ["系统设计", "性能优化", "SEO", "技术写作", "项目管理"],
  },
];

export const timeline: Array<{
  period: string;
  title: string;
  description: string;
  tag?: string;
}> = [
  {
    period: "2024 - 至今",
    title: "全栈开发工程师",
    description:
      "负责多个 Web 产品的架构设计与全栈实现，涵盖内容管理系统、数据分析平台和内部工具链。主导了团队从前端到后端的技术选型与工程化体系建设。",
    tag: "工作",
  },
  {
    period: "2022 - 2024",
    title: "前端开发工程师",
    description:
      "专注于 React 生态系统的复杂应用开发，包括大型 SPA、SSR 应用和组件库建设。在性能优化和用户体验方面积累了丰富的实战经验。",
    tag: "工作",
  },
  {
    period: "2018 - 2022",
    title: "Web 开发探索期",
    description:
      "从 HTML/CSS 入门，逐步深入 JavaScript 生态，独立完成了多个个人项目和开源贡献。这个阶段奠定了对 Web 技术的广泛兴趣和持续学习的习惯。",
    tag: "成长",
  },
];

export const aboutSections: AboutSection[] = [
  {
    title: "关于这个博客",
    items: [
      "这里记录我在技术道路上的学习笔记、项目复盘和思考沉淀。",
      "主要聚焦于 Web 全栈开发、系统架构设计和工程实践。",
      "希望通过写作来整理思路、分享经验、连接同好。",
      "每篇文章都力求回答「是什么、为什么、怎么做」三个问题。",
    ],
  },
  {
    title: "写作原则",
    items: [
      "从实际工作中遇到的问题出发，不追热点，追求长尾价值。",
      "代码示例必须可运行，不省略上下文，读者照着敲能得到同样的结果。",
      "保持更新频率：每周或每两周一篇，持续比爆发更重要。",
      "欢迎通过评论或邮件反馈问题和建议，共同进步。",
    ],
  },
  {
    title: "当前阶段",
    items: [
      "正在构建这套基于 Next.js 的个人博客平台（V1 进行中）。",
      "计划逐步补齐评论系统、全文搜索、RSS 订阅和暗色模式。",
      "长期目标是打造一个可持续运营的技术品牌阵地。",
    ],
  },
];

export const contactChannels: ContactChannel[] = [
  {
    label: "电子邮箱",
    value: "hello@feiyuz.dev",
    href: "mailto:hello@feiyuz.dev",
    note: "首选联系方式，适合技术咨询、合作邀约和一般性交流，通常在 24 小时内回复。",
  },
  {
    label: "GitHub",
    value: "github.com/feiyuz",
    href: "https://github.com/",
    note: "开源项目、代码实验和技术仓库的主页，欢迎 Star 和 Issue。",
  },
  {
    label: "微信公众号",
    value: "FeiyuzTech",
    note: "不定期推送精选技术文章和思考随笔，扫码关注获取最新动态。（二维码占位）",
  },
  {
    label: "留言板",
    value: "评论区骨架已预留",
    href: "/contact",
    note: "也可以直接在本站留言，后续会接入评论系统和通知邮件。",
  },
];
