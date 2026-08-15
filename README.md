# 个人博客项目

这是博客项目的第一阶段本地开发版本，已经完成前台页面骨架、后台管理骨架、Prisma 数据层和本地数据库接入。

## 技术栈

- Next.js 16 + App Router
- TypeScript
- Prisma ORM
- PostgreSQL（通过 Prisma Dev 启动本地开发库）
- ESLint + Prettier
- MDX

## 快速开始

```bash
npm install
npm run db:up
npm run prisma:push
npm run prisma:seed
npm run dev
```

启动完成后，访问 `http://localhost:3000`。

后台登录地址是 `http://localhost:3000/admin/login`，默认账号如下：

- 用户名：`admin`
- 密码：`admin123456`

## 常用命令

```bash
npm run db:up
npm run db:down
npm run db:status
npm run db:docker:up
npm run db:docker:down
npm run db:docker:logs
npm run prisma:generate
npm run prisma:push
npm run prisma:migrate
npm run prisma:studio
npm run prisma:seed
npm run lint
npm run build
```

## 目录说明

- `src/app`：路由页面与 API Route
- `src/modules`：页面级模块
- `src/components`：通用组件
- `src/services`：数据访问与业务边界
- `src/data/mock-content.ts`：本地示例内容
- `src/types`：类型定义
- `prisma/schema.prisma`：数据库模型
- `prisma/seed.ts`：初始化种子数据

## 使用说明

- `db:up` 会启动本机的 Prisma Dev 本地数据库服务。
- `prisma:push` 用于把 Prisma schema 同步到当前本地数据库。
- `prisma:seed` 会写入示例文章、分类、标签、项目和站点内容块。
- `compose.yml` 仍然保留为可选的 Docker 数据库方案。
- `src/app/posts/getting-started/page.mdx` 是一个 MDX 示例页面。
- `src/app/api/health/route.ts` 是一个轻量健康检查接口。

## 当前状态

- 前台页面已经具备浏览、分类、标签、归档、搜索、关于、联系和项目页。
- 后台已经具备文章管理、分类标签、评论审核、媒体资源和系统设置的骨架。
- 当前登录和部分后台能力仍偏本地开发用途，正式上线前还需要补完善的鉴权与会话机制。

## 常见问题

- 如果 `prisma:push` 或 `prisma:seed` 报数据库连接问题，先运行 `npm run db:status` 查看当前 Prisma Dev 的状态。
- 如果本地数据库服务没起来，先重新执行 `npm run db:up`。
- 如果你修改了 `prisma/schema.prisma`，记得重新执行 `npm run prisma:push` 和 `npm run prisma:generate`。
