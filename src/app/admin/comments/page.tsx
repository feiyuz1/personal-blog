import { AdminResourcePage } from "@/modules/admin/admin-resource-page";

const columns = [
  { key: "author", label: "评论人" },
  { key: "email", label: "邮箱" },
  { key: "postTitle", label: "文章" },
  { key: "excerpt", label: "内容摘要" },
  { key: "status", label: "状态" },
  { key: "createdAt", label: "提交时间" },
];

const rows = [
  {
    id: "comment-1",
    values: {
      author: "Alex",
      email: "alex@example.com",
      postTitle: "个人博客 V1 的信息架构与页面边界",
      excerpt: "这篇关于骨架设计的文章很有帮助，想问一下后台表单部分打算怎么拆？",
      status: "待审核",
      createdAt: "2026-04-11 14:32",
    },
  },
  {
    id: "comment-2",
    values: {
      author: "Mina",
      email: "mina@example.com",
      postTitle: "博客文章系统的 MDX 渲染与内容流转",
      excerpt: "建议后续补一个目录自动生成的具体实现示例。",
      status: "待审核",
      createdAt: "2026-04-10 09:15",
    },
  },
  {
    id: "comment-3",
    values: {
      author: "Kevin",
      email: "kevin@example.com",
      postTitle: "Next.js App Router 实战经验总结",
      excerpt: "写得很好！parallel routes 也非常值得介绍。",
      status: "已通过",
      createdAt: "2026-04-08 20:45",
    },
  },
  {
    id: "comment-4",
    values: {
      author: "Lucy",
      email: "lucy@example.com",
      postTitle: "TypeScript 严格模式迁移指南",
      excerpt: "noUncheckedIndexedAccess 开启后怎么处理数组访问？每个地方加 ?. 太繁琐了。",
      status: "待审核",
      createdAt: "2026-04-06 16:20",
    },
  },
  {
    id: "comment-5",
    values: {
      author: "Tom",
      email: "tom@example.com",
      postTitle: "Tailwind CSS 组件抽象与设计模式",
      excerpt: "@apply 指令你们团队用得多吗？我们内部基本禁用了。",
      status: "已拒绝",
      createdAt: "2026-04-04 11:00",
    },
  },
  {
    id: "comment-6",
    values: {
      author: "Sarah",
      email: "sarah@example.com",
      postTitle: "PostgreSQL 性能优化实战笔记",
      excerpt: "pg_stat_statements 怎么开启？能写个步骤吗。",
      status: "待审核",
      createdAt: "2026-04-02 13:55",
    },
  },
  {
    id: "comment-7",
    values: {
      author: "Jack",
      email: "jack@example.com",
      postTitle: "Docker 开发环境搭建最佳实践",
      excerpt: "mutagen 在 Windows 上效果怎么样？",
      status: "待审核",
      createdAt: "2026-03-30 10:30",
    },
  },
  {
    id: "comment-8",
    values: {
      author: "Emily",
      email: "emily@example.com",
      postTitle: "技术写作一年：关于输出的几点思考",
      excerpt: "请问你用什么工具来管理灵感收集箱？Notion 吗？",
      status: "待审核",
      createdAt: "2026-03-22 08:10",
    },
  },
];

export default function AdminCommentsPage() {
  return (
    <AdminResourcePage
      title="评论审核"
      description="审核和管理用户提交的评论内容。通过、拒绝或删除不当评论。"
      columns={columns}
      rows={rows}
      placeholderNote="批量审核操作将在后续迭代中补充。垃圾评论过滤规则待接入。"
      createLabel=""
    />
  );
}
