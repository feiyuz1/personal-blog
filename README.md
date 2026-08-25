# 个人博客项目

基于 Next.js 16 App Router 的个人全栈博客系统，包含前台内容展示、后台管理、RESTful API 与 Prisma 数据层。

## 技术栈

- Next.js 16 + App Router（standalone 输出）
- React 19 + TypeScript
- Prisma 6 + PostgreSQL 16
- Tailwind CSS 4
- MDX
- Vercel AI SDK 7 + OpenAI-compatible Provider（Live2D AI 看板娘）
- Zustand + Web Audio（聊天状态、TTS 与嘴型同步）
- jose（JWT 会话）+ bcryptjs（密码哈希）
- 代码高亮：highlight.js（CDN 按需加载）

## 快速开始

```bash
npm install
cp .env.example .env   # 填入数据库连接与会话密钥
npm run db:up
npm run prisma:push
npm run prisma:seed
npm run dev
```

> 需要 Node.js 22+。AI/语音为可配置功能；填写 `.env.example` 中的 `AI_API_KEY`、`AI_CHAT_MODEL`、`MASCOT_TTS_VOICE` 后可完整体验，未配置时博客和 Live2D 仍可正常运行。

启动后访问 `http://localhost:3000`。后台登录地址 `http://localhost:3000/admin/login`，默认账号：

- 用户名：`admin`
- 密码：`admin123456`

> 环境变量 `SESSION_SECRET` 必须配置，否则登录会报错。本地开发可沿用 `.env.example` 中的占位值，生产环境务必用 `openssl rand -base64 32` 重新生成。`APP_ORIGIN` 用于写接口同源校验，本地填 `http://localhost:3000`。

## 常用命令

```bash
# 数据库
npm run db:up            # 启动 Prisma Dev 本地数据库
npm run db:down
npm run db:status
npm run db:docker:up     # 或用 Docker 启动数据库
npm run db:docker:down

# Prisma
npm run prisma:generate
npm run prisma:push      # 同步 schema 到数据库（开发用）
npm run prisma:migrate   # 创建迁移（规范方式）
npm run prisma:seed      # 填充初始数据
npm run prisma:studio    # 可视化管理

# 代码质量
npm run lint
npm run build
```

## 目录说明

- `src/app`：路由页面与 API Route
  - `api/admin/*`：后台管理接口（鉴权 + 同源校验）
  - `api/comments`：评论提交与查询
  - `admin/*`：后台页面
- `src/modules`：页面级模块（前台与后台）
- `src/components`：通用组件
- `src/services`：数据访问与业务边界（content-service / admin-service）
- `src/lib/auth`：会话与 JWT（token.ts / session.ts）
- `src/lib`：基础能力封装（prisma、api-response、rate-limit、request-origin）
- `src/features/mascot`：独立的 AI 看板娘产品模块（UI、AI、TTS、LipSync、限额、Memory/RAG 接口）
- `src/middleware.ts`：后台路径乐观鉴权重定向
- `src/data/mock-content.ts`：本地示例内容（站点配置/关于/技术栈/时间线/联系方式）
- `src/types`：类型定义
- `prisma/schema.prisma`：数据库模型
- `prisma/seed.ts`：初始化种子数据
- `Dockerfile` / `compose.prod.yml` / `nginx/blog.conf`：生产部署件

## 关于 seed 数据

`prisma:seed` 当前仅写入（会清空现有内容，请仅用于开发环境）：

- 一个管理员账号（admin / admin123456）
- 六个站点内容块（site-config、about-sections、contact-channels、profile-info、tech-stacks、timeline）

**不包含示例文章、分类、标签和项目**。文章与项目内容需通过后台手动创建，或后续扩展 seed 脚本补充。

若默认账号无法登录，请先确认已执行 `npm run prisma:seed`；生产环境请改用单独创建的强密码账号，切勿使用默认凭据。

## 当前功能状态

### 前台

- 首页、文章列表与详情、分类、标签、归档、搜索、关于我、联系我、项目展示
- Live2D 看板娘小羽：流式 AI 对话、页面上下文、TTS、Web Audio 嘴型同步、响应式聊天面板
- 文章详情：目录导航、上下篇、代码块语法高亮（highlight.js）
- 文章详情评论区：展示已通过评论（支持嵌套回复）、提交评论（审核制）

### 后台

- 概览、文章管理（新建/编辑/删除/草稿/发布）
- 分类标签管理
- 媒体资源管理（上传/列表/删除/分页）
- 评论审核（待审核/已通过/已拒绝切换、通过/拒绝/删除）
- 系统设置（站点信息/SEO/社交链接可编辑保存）
- 登录鉴权：JWT 会话 + Cookie（httpOnly）、登录限流、同源校验、中间件乐观重定向

### API

- 公开：文章、分类、标签、搜索、归档、项目、评论、RSS、联系、健康检查
- 管理：登录/登出、文章 CRUD、分类标签、媒体、评论审核、系统设置

## 生产部署

项目提供完整的生产部署件，基于 Docker Compose 三服务编排（postgres + web + nginx）：

```bash
cp .env.prod.example .env.prod   # 填入生产数据库口令、SESSION_SECRET、域名等
docker compose -f compose.prod.yml --env-file .env.prod up -d --build
```

部署前需在数据库中执行迁移（在有 Prisma CLI 的环境运行）：

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db npx prisma migrate deploy
```

详见 `Dockerfile`、`compose.prod.yml`、`nginx/blog.conf`。AI 流式部署、Provider、限额和 LipSync 说明见 [`docs/mascot-ai.md`](docs/mascot-ai.md)，CI 配置见 `.github/workflows/ci.yml`。

## 常见问题

- `prisma:push` / `prisma:seed` 报数据库连接问题：先 `npm run db:status` 查看状态，必要时重新 `npm run db:up`。
- 修改 `prisma/schema.prisma` 后需重新执行 `npm run prisma:push` 和 `npm run prisma:generate`。
- 登录报 "SESSION_SECRET 未配置"：在 `.env` 中配置 `SESSION_SECRET`。
- 写接口（上传/评论/审核等）报 "来源校验失败"：在 `.env` 中配置 `APP_ORIGIN` 与站点地址一致。
- 小羽显示“AI 服务尚未配置”：填写服务端 `AI_API_KEY` 与 `AI_CHAT_MODEL`，重启 Next.js。
- AI 文字不是逐步出现：确认反向代理对 `/api/mascot/chat` 设置了 `proxy_buffering off`。
