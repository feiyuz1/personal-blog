# =============================================================================
# Feiyuz Blog 生产镜像（Next.js standalone + Prisma）
# 多阶段构建：deps → builder → runner，最终镜像仅含运行时所需产物
# =============================================================================

# ---------- 阶段 1：安装依赖 ----------
FROM node:22-alpine AS deps
WORKDIR /app

# 仅拷贝依赖描述与 prisma schema，利用缓存层
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# 安装依赖并生成 Prisma Client
RUN npm ci --omit=dev=false || npm install
RUN npx prisma generate

# ---------- 阶段 2：构建应用 ----------
FROM node:22-alpine AS builder
WORKDIR /app

# 关闭 Next 遥测，避免构建噪音
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---------- 阶段 3：运行时镜像 ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 创建非 root 用户运行应用，降低容器逃逸风险
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# 拷贝静态资源与 standalone 产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma 运行时需要 client 产物与 schema
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000

# standalone 构建在 .next/standalone 根目录生成 server.js
CMD ["node", "server.js"]
