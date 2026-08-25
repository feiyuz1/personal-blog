# Live2D AI 看板娘「小羽」

## 1. 架构与模块边界

小羽作为独立产品模块放在 `src/features/mascot`，博客只在 `SiteShell` 中提供站点元信息和现有 Live2D Renderer：

```text
Feiyuz Blog / SiteShell
  └─ MascotMount（Feature Flags + Host Context）
       ├─ 现有 Live2DPet Renderer
       └─ BlogMascotHost
            └─ MascotRoot
                 ├─ Chat UI / Zustand 状态
                 ├─ AI Text Stream
                 ├─ TTS / Web Audio
                 └─ MascotLive2DAdapter
```

核心职责：

- `core/`：通用类型、Persona、Prompt Builder、配置、输入/历史/输出限制。
- `ai/`：`MascotAIProvider` 与 OpenAI-compatible/Vercel AI SDK 实现。
- `tts/`：`MascotTTSProvider` 与 OpenAI-compatible speech 实现。
- `audio/`：浏览器音频播放、RMS 分析、嘴型平滑和资源清理。
- `live2d/`：与具体 Cubism 运行时隔离的 Adapter。
- `memory/`、`rag/`：可替换接口与默认 Noop Provider。
- `server/`：Visitor、限额、服务编排和安全响应。
- `components/`、`store/`：响应式 UI 与跨组件状态。
- `host/`：当前 Next.js 博客的页面元信息适配。
- `src/app/api/mascot/*`：只负责把 HTTP 请求转交给模块服务。

模块公共入口为 `src/features/mascot/index.ts`。Mascot Core 不导入文章表、博客页面组件、后台鉴权或 Prisma；Host Context 只包含站点名、简介、路径、标题、文章标识和页面类型。

## 2. AI Provider 与流式协议

`MascotAIProvider` 的默认实现通过 `@ai-sdk/openai-compatible` 创建模型，并用 AI SDK `streamText` 生成真实 UTF-8 文本流：

```http
POST /api/mascot/chat
Content-Type: application/json

{
  "conversationId": "uuid",
  "message": "MountPoint 和 Pak 是什么关系？",
  "history": [{ "role": "user", "content": "..." }],
  "page": {
    "pathname": "/posts/example",
    "title": "文章标题",
    "articleId": "example",
    "type": "article"
  }
}
```

响应为 `text/plain; charset=utf-8`，每个模型文本增量直接进入 Web Stream。客户端只提交 `user/assistant` 历史；Zod strict schema 会拒绝 `system/developer` 等角色，System Prompt 永远由服务端 Persona 和 Prompt Builder 生成。

模型、Key 和 Base URL 都来自服务端环境变量。`AI_PROVIDER` 作为兼容 Provider 名称，默认 `siliconflow`，但业务层不依赖该名称；只要目标服务兼容 `/v1/chat/completions`，即可仅修改环境变量切换。Provider 返回 usage 时会记录真实的 input/output/total tokens；缺失字段保持未知，不做估算。

## 3. TTS Provider 与语音 UX

`POST /api/mascot/tts` 接收 `{ "text": "..." }`，经过同源校验、Zod、分钟限流、单次字符限制和每日字符额度后，请求 OpenAI-compatible `/audio/speech`。默认返回 MP3，也会透传 Provider 返回的实际 `audio/*` Content-Type。

TTS 配置优先级：

1. `MASCOT_TTS_BASE_URL` / `MASCOT_TTS_API_KEY`
2. `TTS_BASE_URL` / `TTS_API_KEY`
3. `AI_BASE_URL` / `AI_API_KEY`

模型和 voice 不设私人默认值；`MASCOT_TTS_VOICE` 必须由部署者配置。首次访问语音关闭，用户主动开启后只把布尔偏好写入 `localStorage["mascot.voiceEnabled"]`。AI 回答完成后会去除 Markdown 标记并按标点/单次 TTS 字符上限安全分段、顺序播放。任意语音失败只显示非阻塞提示，已经生成的文字和下一轮聊天不受影响。

人物点击使用独立的固定语音链路：20 条台词已用 Diana 预生成到带清单指纹的静态目录，浏览器按一年 `immutable` 缓存，不消耗访客动态 TTS 额度。模型、音色、语速或台词变化后需重新生成：

```bash
npm run mascot:cache-voices
```

`prebuild` 会检查版本和每个 MP3 的 SHA-256；缺失或过期时拒绝构建。静音时人物仍显示表情和气泡，但不会预热或播放音频；快速连续点击只保留最后一段。

## 4. 环境变量

完整示例见 `.env.example` 和 `.env.prod.example`。关键配置如下：

| 变量                           | 默认/说明                                 |
| ------------------------------ | ----------------------------------------- |
| `MASCOT_ENABLED`               | `true`；关闭后整个模块不挂载              |
| `MASCOT_LIVE2D_ENABLED`        | `true`；独立控制现有 Renderer             |
| `MASCOT_AI_ENABLED`            | `true`；关闭后保留 Live2D，聊天输入不可用 |
| `AI_PROVIDER`                  | `siliconflow`                             |
| `AI_BASE_URL`                  | `https://api.siliconflow.cn/v1`           |
| `AI_API_KEY`                   | 必填，服务端专用                          |
| `AI_CHAT_MODEL`                | 必填，不在源码中固定模型                  |
| `AI_MAX_OUTPUT_TOKENS`         | `384`                                     |
| `MASCOT_TTS_ENABLED`           | `true`；可独立关闭                        |
| `MASCOT_TTS_MODEL`             | TTS 模型 ID                               |
| `MASCOT_TTS_VOICE`             | 必填的音色 ID                             |
| `MASCOT_TTS_SPEED`             | `1.05`，服务端限制在 `0.25～4`            |
| `MASCOT_MEMORY_ENABLED`        | `false`；默认 Noop                        |
| `MASCOT_RAG_ENABLED`           | `false`；默认 Noop                        |
| `MASCOT_STT_ENABLED`           | `false`；仅预留 Feature Flag              |
| `MASCOT_PERSONA_NAME`          | `小羽`                                    |
| `MASCOT_PERSONA_PROMPT`        | 可选；完整覆盖默认 Persona                |
| `MASCOT_HOST_SITE_NAME`        | 服务端可信站点名称                        |
| `MASCOT_HOST_SITE_DESCRIPTION` | 服务端可信站点简介                        |

只有不带 `NEXT_PUBLIC_` 前缀的服务端变量保存 AI/TTS 密钥。客户端只收到功能是否启用、服务是否已配置、输入长度等非敏感布尔值/数字。

## 5. Token、历史与额度限制

默认服务端硬限制：

| 项目                |            默认值 | 环境变量                      |
| ------------------- | ----------------: | ----------------------------- |
| 当前输入            |          600 字符 | `MASCOT_MAX_INPUT_CHARS`      |
| 最近历史            | 4 轮（最多 8 条） | `MASCOT_HISTORY_TURNS`        |
| 历史总量            |         1600 字符 | `MASCOT_MAX_HISTORY_CHARS`    |
| 模型输出            |        384 tokens | `AI_MAX_OUTPUT_TOKENS`        |
| 每分钟聊天/TTS 请求 |                 8 | `MASCOT_REQUESTS_PER_MINUTE`  |
| 每日聊天请求        |                30 | `MASCOT_DAILY_REQUEST_LIMIT`  |
| 单次 TTS            |          500 字符 | `MASCOT_TTS_MAX_CHARS`        |
| 每日 TTS            |         5000 字符 | `MASCOT_TTS_DAILY_CHAR_LIMIT` |

同一匿名 Visitor 同时只能有一个 AI 流。限制以 HttpOnly、SameSite=Lax 的 `mascot_visitor` UUID Cookie 为主，IP 分钟桶为补充；生产 HTTPS 会自动添加 `Secure`。每日窗口按 UTC 自然日计算。

默认 Usage Limiter 是有上限和过期清理的进程内实现，适合当前单实例部署；重启会重置额度，多进程/多副本部署必须将 `MascotUsageLimiter` 的存储替换为 Redis 或数据库原子计数器，接口上层无需改动。

## 6. 开发运行

AI SDK 7 要求 Node.js 22 或更高版本；仓库的 `.nvmrc`、Dockerfile 与 CI 已统一到 Node 22。

```bash
nvm use
npm install
cp .env.example .env
# 填写数据库、APP_ORIGIN、AI_API_KEY、AI_CHAT_MODEL 和 TTS voice
npm run db:up
npm run prisma:push
npm run dev
```

访问 `http://localhost:3000`。点击小羽会触发表情、固定台词和已启用的语音；点击人物工具栏中的“聊天”按钮才会打开对话框。未配置 AI/TTS 时 UI 会显示可读的降级状态，博客和 Live2D 仍可使用。

## 7. 生产部署与 Nginx Streaming

`compose.prod.yml` 已显式透传全部 Mascot 服务端变量。准备 `.env.prod` 后执行：

```bash
docker compose -f compose.prod.yml --env-file .env.prod up -d --build
```

Nginx/其他反向代理不能缓冲聊天响应。仓库的 `nginx/blog.conf` 已包含：

```nginx
location = /api/mascot/chat {
    proxy_pass http://blog_app;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 60s;
}
```

其中 `proxy_buffering off` 是流式体验的关键；若前面还有 CDN，也要确认其支持并透传 streaming response。应用响应同时发送 `X-Accel-Buffering: no`。`APP_ORIGIN` 必须与浏览器访问源完全一致（不要带末尾斜杠），否则 Chat/TTS 写接口会 fail-closed。

## 8. Live2D LipSync

Web Audio 使用一个 `MediaElementAudioSourceNode` 和 `AnalyserNode` 获取时域采样，计算 RMS 后执行噪声门、增益和指数平滑：

```text
normalized = clamp((rms - 0.018) * 7.5, 0, 1)
mouth = previous * 0.65 + normalized * 0.35
```

单一 `requestAnimationFrame` 每帧直接调用 `MascotLive2DAdapter.setMouthOpen()`，不会触发 React state/render。播放结束、关闭聊天、禁用语音和组件卸载都会归零嘴型、取消 RAF、停止音频、关闭 AudioContext 并 revoke Object URL。

现有 vendored Cubism runtime 在加载 `model3.json` 时自动读取 `Groups[].Name === "LipSync"` 的参数，并验证 ID 确实存在于 moc。没有有效 Group 时才尝试同样经过验证的 `ParamMouthOpenY`。外部嘴型在每帧 motion/expression/physics/pose 之后、`model.update()` 之前覆盖，因此不会被表情的 Mouth 参数吞掉；250ms 没有新音量会自动失活防止卡住张嘴。

运行时只暴露窄桥 `window.__MASCOT_LIVE2D_RUNTIME__`（嘴型、状态、表情、动作、参数 ID），`CurrentLive2DAdapter` 是唯一知道该全局对象的模块。Chat/Audio 不访问 Cubism model 或 SDK 私有对象。

## 9. Memory / RAG 扩展点

当前默认实现分别为 `NoopMascotMemoryProvider` 和 `NoopMascotKnowledgeRetriever`：关闭时 Prompt Builder 得到空数组，聊天主链路不分叉、不产生假数据。

接入长期记忆时实现 `MascotMemoryProvider` 的 `getMemories/saveMemory/clearMemories` 并在 `server/dependencies.ts` 注入。持久化前必须增加用户主动 opt-in，只保存 nickname、interest、preference、learning_topic 等非敏感偏好。

接入知识库时实现 `MascotKnowledgeRetriever.retrieve({ query, articleId, limit })`，可使用 PostgreSQL + pgvector。返回的 `KnowledgeChunk` 会进入 Prompt Builder 的受限知识上下文；无需改写 API、AI Provider 或 UI。当前只传页面路径、标题和文章标识，不会把页面 HTML 发送给模型。

## 10. 安全与降级

- Chat/TTS 强制 `verifySameOrigin()`，请求体有 Content-Type、字节数和 Zod strict 校验。
- Persona、System Prompt、Provider Key、模型配置只存在于服务端。
- AI Markdown 经 `rehype-sanitize` 渲染；不使用 `dangerouslySetInnerHTML`，远程图片不渲染。
- Provider 原始错误和堆栈不会发送给浏览器。
- AI 失败可重试；Abort 会中止 fetch/模型请求并释放并发锁。
- TTS、Web Audio、表情或动作失败均不会影响 AI 文字和博客主体。
- `MASCOT_ENABLED=false` 可移除全部挂载；各子功能可独立关闭。
