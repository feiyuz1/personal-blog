import { ZodError } from "zod";

import { verifySameOrigin } from "@/lib/request-origin";

import {
  getMascotFeatureConfig,
  MascotConfigurationError,
} from "../core/config";
import { getMascotLimits } from "../core/limits";
import { getMascotName } from "../core/identity";
import {
  createTTSRequestSchema,
  MASCOT_TTS_MAX_BODY_BYTES,
  readJsonBody,
  RequestBodyError,
} from "../core/validation";
import { createMascotTTSProvider } from "../tts";
import { mascotJsonError } from "./http";
import { mascotUsageLimiter } from "./usage-limiter";
import {
  attachMascotVisitorCookie,
  getMascotClientIp,
  resolveMascotVisitor,
} from "./visitor";

export async function handleMascotTTSRequest(request: Request) {
  const features = getMascotFeatureConfig();
  const mascotName = getMascotName();
  if (!features.enabled || !features.ttsEnabled) {
    return mascotJsonError(
      503,
      "TTS_DISABLED",
      `${mascotName}的语音功能暂未开放。`,
    );
  }
  if (!verifySameOrigin(request)) {
    return mascotJsonError(403, "INVALID_ORIGIN", "请求来源校验失败。");
  }

  const limits = getMascotLimits();
  try {
    const body = await readJsonBody(request, MASCOT_TTS_MAX_BODY_BYTES);
    const input = createTTSRequestSchema(limits).parse(body);
    const provider = createMascotTTSProvider();
    const visitor = resolveMascotVisitor(request);
    const decision = mascotUsageLimiter.consumeTts(
      visitor.id,
      getMascotClientIp(request),
      input.text.length,
      limits,
    );

    if (!decision.allowed) {
      const message =
        decision.reason === "tts-daily"
          ? "今天的语音额度已经用完了，文字聊天仍然可以继续。"
          : "语音请求太频繁啦，请稍后再试。";
      const response = mascotJsonError(429, decision.reason, message, {
        "Retry-After": String(decision.retryAfterSeconds),
      });
      return attachMascotVisitorCookie(response, visitor);
    }

    const audio = await provider.synthesize({
      text: input.text,
      abortSignal: request.signal,
    });
    const response = new Response(audio.data, {
      headers: {
        "Content-Type": audio.contentType,
        "Content-Length": String(audio.data.byteLength),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
    return attachMascotVisitorCookie(response, visitor);
  } catch (error) {
    if (error instanceof MascotConfigurationError) {
      return mascotJsonError(
        503,
        error.code,
        `${mascotName}的语音服务还没有配置好，文字回答不受影响。`,
      );
    }
    if (error instanceof RequestBodyError) {
      return mascotJsonError(
        error.code === "BODY_TOO_LARGE" ? 413 : 400,
        error.code,
        error.code === "BODY_TOO_LARGE"
          ? "语音请求太大了。"
          : "语音请求格式不正确。",
      );
    }
    if (error instanceof ZodError) {
      return mascotJsonError(400, "INVALID_INPUT", "朗读文本不符合要求。");
    }

    console.error("Mascot TTS synthesis failed.");
    return mascotJsonError(
      502,
      "TTS_REQUEST_FAILED",
      "语音暂时没有合成成功，文字回答不受影响。",
    );
  }
}
