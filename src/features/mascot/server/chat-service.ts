import { ZodError } from "zod";

import { verifySameOrigin } from "@/lib/request-origin";

import { createMascotAIProvider } from "../ai";
import {
  getMascotFeatureConfig,
  MascotConfigurationError,
} from "../core/config";
import { getMascotLimits } from "../core/limits";
import { getMascotName } from "../core/identity";
import { buildMascotPrompt } from "../core/prompt";
import {
  MASCOT_MAX_BODY_BYTES,
  parseChatInput,
  readJsonBody,
  RequestBodyError,
} from "../core/validation";
import { createMascotServerDependencies } from "./dependencies";
import { createServerHostContext } from "./host-context";
import { mascotJsonError } from "./http";
import { mascotUsageLimiter } from "./usage-limiter";
import {
  attachMascotVisitorCookie,
  getMascotClientIp,
  resolveMascotVisitor,
} from "./visitor";

const AI_ERROR_MESSAGE = "唔，好像没接上信号……稍后再找我试试吧。";

export async function handleMascotChatRequest(request: Request) {
  const features = getMascotFeatureConfig();
  const mascotName = getMascotName();
  if (!features.enabled || !features.aiEnabled) {
    return mascotJsonError(
      503,
      "AI_DISABLED",
      `${mascotName}的聊天功能暂未开放。`,
    );
  }
  if (!verifySameOrigin(request)) {
    return mascotJsonError(403, "INVALID_ORIGIN", "请求来源校验失败。");
  }

  const limits = getMascotLimits();
  let visitor: ReturnType<typeof resolveMascotVisitor> | undefined;
  let lockAcquired = false;

  try {
    const body = await readJsonBody(request, MASCOT_MAX_BODY_BYTES);
    const input = parseChatInput(body, limits);
    const aiProvider = createMascotAIProvider();
    visitor = resolveMascotVisitor(request);

    const decision = mascotUsageLimiter.beginChat(
      visitor.id,
      getMascotClientIp(request),
      limits,
    );
    if (!decision.allowed) {
      const message =
        decision.reason === "concurrent"
          ? "上一条回答还在生成，请稍等一下。"
          : decision.reason === "daily"
            ? `今天聊得有点多啦，明天再来找${mascotName}吧。`
            : "消息发送得太快啦，稍等一会儿再试。";
      const response = mascotJsonError(429, decision.reason, message, {
        "Retry-After": String(decision.retryAfterSeconds),
      });
      return attachMascotVisitorCookie(response, visitor);
    }
    lockAcquired = true;

    const dependencies = createMascotServerDependencies();
    const [memories, knowledgeContext] = await Promise.all([
      features.memoryEnabled
        ? dependencies.memory.getMemories(visitor.id)
        : Promise.resolve([]),
      features.ragEnabled
        ? dependencies.knowledge.retrieve({
            query: input.message,
            articleId: input.page?.articleId,
            limit: 4,
          })
        : Promise.resolve([]),
    ]);
    const prompt = buildMascotPrompt({
      hostContext: createServerHostContext(input.page),
      history: input.history,
      message: input.message,
      memories,
      knowledgeContext,
    });

    let finalized = false;
    const finalize = () => {
      if (finalized || !visitor) return;
      finalized = true;
      lockAcquired = false;
      mascotUsageLimiter.releaseChat(visitor.id);
    };

    const response = await aiProvider.streamChat({
      ...prompt,
      maxOutputTokens: limits.maxOutputTokens,
      abortSignal: request.signal,
      onUsage: (usage) => {
        if (visitor) mascotUsageLimiter.recordTokenUsage(visitor.id, usage);
      },
      onComplete: finalize,
      onAbort: finalize,
      onError: finalize,
    });
    response.headers.set(
      "X-Mascot-Conversation-Id",
      input.conversationId ?? crypto.randomUUID(),
    );
    return attachMascotVisitorCookie(response, visitor);
  } catch (error) {
    if (lockAcquired && visitor) {
      mascotUsageLimiter.releaseChat(visitor.id);
    }

    if (error instanceof MascotConfigurationError) {
      return mascotJsonError(
        503,
        error.code,
        `${mascotName}还没有连接好 AI 服务，请稍后再试。`,
      );
    }
    if (error instanceof RequestBodyError) {
      return mascotJsonError(
        error.code === "BODY_TOO_LARGE" ? 413 : 400,
        error.code,
        error.code === "BODY_TOO_LARGE"
          ? "消息请求太大了。"
          : "消息格式不正确。",
      );
    }
    if (error instanceof ZodError) {
      return mascotJsonError(
        400,
        "INVALID_INPUT",
        "消息内容或上下文不符合要求。",
      );
    }

    console.error("Mascot chat request failed.");
    return mascotJsonError(502, "AI_REQUEST_FAILED", AI_ERROR_MESSAGE);
  }
}
