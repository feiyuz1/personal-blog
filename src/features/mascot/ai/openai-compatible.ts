import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, type ModelMessage } from "ai";

import {
  MASCOT_CHAT_STREAM_CONTENT_TYPE,
  MASCOT_CHAT_STREAM_PROTOCOL,
  encodeMascotChatStreamEvent,
} from "../core/chat-stream";
import type { MascotAIProvider, MascotAIStreamInput } from "./provider";

type OpenAICompatibleMascotConfig = {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
};

export class OpenAICompatibleMascotProvider implements MascotAIProvider {
  constructor(private readonly config: OpenAICompatibleMascotConfig) {}

  async streamChat(input: MascotAIStreamInput) {
    const provider = createOpenAICompatible({
      name: this.config.provider,
      baseURL: this.config.baseUrl,
      apiKey: this.config.apiKey,
      includeUsage: true,
    });

    const messages: ModelMessage[] = input.messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const upstreamController = new AbortController();
    const upstreamSignal = AbortSignal.any([
      input.abortSignal,
      upstreamController.signal,
    ]);
    let lifecycleReported = false;
    let errorLogged = false;
    const reportComplete = (usage: {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    }) => {
      if (lifecycleReported) return;
      lifecycleReported = true;
      input.onUsage?.(usage);
      input.onComplete?.();
    };
    const reportAbort = () => {
      if (lifecycleReported) return;
      lifecycleReported = true;
      input.onAbort?.();
    };
    const reportError = (error: unknown) => {
      if (!errorLogged) {
        errorLogged = true;
        console.error("Mascot AI stream failed:", safeProviderError(error));
      }
      if (lifecycleReported) return;
      lifecycleReported = true;
      input.onError?.();
    };

    const result = streamText({
      model: provider.chatModel(this.config.model),
      system: input.system,
      messages,
      maxOutputTokens: input.maxOutputTokens,
      maxRetries: 1,
      temperature: 0.35,
      topP: 0.8,
      frequencyPenalty: 0.15,
      abortSignal: upstreamSignal,
      timeout: 60_000,
      onEnd: ({ usage }) => {
        reportComplete({
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
        });
      },
      onAbort: () => {
        reportAbort();
      },
      onError: ({ error }) => {
        reportError(error);
      },
    });

    const reader = result.stream.getReader();
    let firstText = "";

    try {
      while (!firstText) {
        const { done, value } = await reader.read();
        if (done) {
          reportError(new Error("AI provider returned an empty response"));
          await reader.cancel();
          return providerJsonError(
            "AI_EMPTY_RESPONSE",
            "小羽没有收到完整回复，请稍后再试。",
            true,
          );
        }
        if (value.type === "error") {
          reportError(value.error);
          await reader.cancel();
          return providerJsonError(
            "AI_STREAM_FAILED",
            providerErrorMessage(value.error),
            isRetryableProviderError(value.error),
          );
        }
        if (value.type === "abort") {
          reportAbort();
          await reader.cancel();
          throw new DOMException("AI stream aborted", "AbortError");
        }
        if (value.type === "text-delta" && value.text) {
          firstText = value.text;
        }
        // AI SDK 的 onEnd 要等完整流读到 done 才会触发；finish 只是最后一个数据事件。
        // 这里继续读取，避免成功响应遗留并发锁，导致紧接着的下一问被 429 拒绝。
        if (value.type === "finish") continue;
      }
    } catch (error) {
      if (isAbortError(error)) {
        reportAbort();
        throw error;
      }
      reportError(error);
      await reader.cancel().catch(() => undefined);
      return providerJsonError(
        "AI_STREAM_FAILED",
        providerErrorMessage(error),
        isRetryableProviderError(error),
      );
    }

    let firstPending = true;
    let streamClosed = false;
    let finishReceived = false;
    const body = new ReadableStream<Uint8Array>({
      pull: async (controller) => {
        if (streamClosed) return;
        if (firstPending) {
          firstPending = false;
          controller.enqueue(
            encodeMascotChatStreamEvent({ type: "delta", text: firstText }),
          );
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              streamClosed = true;
              controller.enqueue(
                encodeMascotChatStreamEvent(
                  finishReceived
                    ? { type: "done" }
                    : {
                        type: "error",
                        code: "AI_STREAM_TRUNCATED",
                        message: "AI 回复提前中断，请稍后再试。",
                        retryable: true,
                      },
                ),
              );
              if (!finishReceived) {
                reportError(
                  new Error("AI provider stream ended before finish"),
                );
              }
              controller.close();
              return;
            }
            if (value.type === "text-delta" && value.text) {
              controller.enqueue(
                encodeMascotChatStreamEvent({
                  type: "delta",
                  text: value.text,
                }),
              );
              return;
            }
            if (value.type === "error") {
              reportError(value.error);
              streamClosed = true;
              controller.enqueue(
                encodeMascotChatStreamEvent({
                  type: "error",
                  code: "AI_STREAM_FAILED",
                  message: providerErrorMessage(value.error),
                  retryable: isRetryableProviderError(value.error),
                }),
              );
              controller.close();
              await reader.cancel().catch(() => undefined);
              return;
            }
            if (value.type === "abort") {
              reportAbort();
              streamClosed = true;
              controller.close();
              await reader.cancel().catch(() => undefined);
              return;
            }
            // 继续读到 done，确保 AI SDK 执行 onEnd/onComplete 并释放会话锁。
            if (value.type === "finish") {
              finishReceived = true;
              continue;
            }
          }
        } catch (error) {
          if (isAbortError(error)) {
            reportAbort();
          } else {
            reportError(error);
            controller.enqueue(
              encodeMascotChatStreamEvent({
                type: "error",
                code: "AI_STREAM_FAILED",
                message: providerErrorMessage(error),
                retryable: isRetryableProviderError(error),
              }),
            );
          }
          streamClosed = true;
          controller.close();
        }
      },
      cancel: async (reason) => {
        streamClosed = true;
        // 浏览器停止读取时主动终止上游请求，并立即释放服务端的并发会话锁。
        reportAbort();
        upstreamController.abort(reason);
        await reader.cancel(reason).catch(() => undefined);
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": MASCOT_CHAT_STREAM_CONTENT_TYPE,
        "X-Mascot-Stream-Protocol": MASCOT_CHAT_STREAM_PROTOCOL,
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}

function providerJsonError(code: string, message: string, retryable: boolean) {
  return Response.json(
    { code, message, retryable },
    {
      status: 502,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

function providerStatus(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const value = error as Record<string, unknown>;
  return typeof value.statusCode === "number"
    ? value.statusCode
    : typeof value.status === "number"
      ? value.status
      : undefined;
}

function isRetryableProviderError(error: unknown) {
  const status = providerStatus(error);
  return (
    status === undefined || status === 408 || status === 429 || status >= 500
  );
}

function providerErrorMessage(error: unknown) {
  const status = providerStatus(error);
  if (status === 401 || status === 403) {
    return "小羽暂时没有连接好 AI 服务，请联系站点管理员。";
  }
  if (status === 429) return "AI 服务现在有点忙，请稍后再试。";
  if (status !== undefined && status >= 500) {
    return "AI 服务暂时繁忙，请稍后再试。";
  }
  return "小羽没有收到完整回复，请稍后再试。";
}

function safeProviderError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { name: typeof error, statusCode: undefined, code: undefined };
  }
  const value = error as Record<string, unknown>;
  return {
    name: typeof value.name === "string" ? value.name : "Error",
    statusCode: providerStatus(error),
    code: typeof value.code === "string" ? value.code : undefined,
  };
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
