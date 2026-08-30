import type {
  MascotAudioResult,
  MascotTTSInput,
  MascotTTSProvider,
} from "./provider";

type OpenAICompatibleTTSConfig = {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  voice: string;
  stylePrompt: string;
  speed: number;
};

const COSYVOICE_PROMPT_SEPARATOR = "<|endofprompt|>";
const TERMINAL_PUNCTUATION = /[。！？!?；;…][”’"'）)】》」』]*$/u;

/**
 * 动态对话 TTS 的文本归一化：补齐句末停顿，并仅为硅基流动 CosyVoice
 * 加入指令式风格提示。WAV 构建素材已自行携带提示，不能重复注入。
 */
export function prepareTTSProviderInput(
  text: string,
  config: Pick<OpenAICompatibleTTSConfig, "provider" | "model" | "stylePrompt">,
  responseFormat: "mp3" | "wav",
) {
  const shouldInjectCosyVoicePrompt =
    responseFormat === "mp3" &&
    config.provider.toLowerCase().includes("silicon") &&
    config.model.toLowerCase().includes("cosyvoice");
  const safeText = shouldInjectCosyVoicePrompt
    ? text.replaceAll(COSYVOICE_PROMPT_SEPARATOR, " ").trim()
    : text.trim();
  const punctuated = TERMINAL_PUNCTUATION.test(safeText)
    ? safeText
    : `${safeText}。`;

  if (!shouldInjectCosyVoicePrompt || !config.stylePrompt.trim()) {
    return punctuated;
  }
  return `${config.stylePrompt.trim()}${COSYVOICE_PROMPT_SEPARATOR}${punctuated}`;
}

export class OpenAICompatibleTTSProvider implements MascotTTSProvider {
  constructor(private readonly config: OpenAICompatibleTTSConfig) {}

  async synthesize({
    text,
    abortSignal,
    responseFormat = "mp3",
  }: MascotTTSInput): Promise<MascotAudioResult> {
    const response = await fetch(`${this.config.baseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        input: prepareTTSProviderInput(text, this.config, responseFormat),
        voice: this.config.voice,
        speed: this.config.speed,
        response_format: responseFormat,
        // 硅基流动当前在 stream=true 时可能返回 200 空响应；显式关闭后才会返回音频正文。
        // 下游仍直接转发 Response.body，避免服务端再次复制整段音频。
        stream: false,
      }),
      cache: "no-store",
      signal: AbortSignal.any([abortSignal, AbortSignal.timeout(45_000)]),
    });

    const contentType = response.headers.get("content-type") ?? "audio/mpeg";
    if (
      !response.ok ||
      !contentType.toLowerCase().startsWith("audio/") ||
      !response.body
    ) {
      throw new Error(`TTS provider request failed with ${response.status}`);
    }

    // 预读首块可以在返回 200 前识别空响应，同时仍保留后续字节的流式传输。
    const reader = response.body.getReader();
    const first = await reader.read();
    if (first.done || !first.value?.byteLength) {
      await reader.cancel().catch(() => undefined);
      throw new Error("TTS provider returned empty audio");
    }

    let firstPending = true;
    const body = new ReadableStream<Uint8Array>({
      pull: async (controller) => {
        if (firstPending) {
          firstPending = false;
          controller.enqueue(first.value);
          return;
        }
        try {
          const next = await reader.read();
          if (next.done) {
            controller.close();
          } else {
            controller.enqueue(next.value);
          }
        } catch (error) {
          controller.error(error);
        }
      },
      cancel: (reason) => reader.cancel(reason),
    });

    const declaredLength = Number.parseInt(
      response.headers.get("content-length") ?? "",
      10,
    );
    return {
      body,
      contentType,
      contentLength:
        Number.isFinite(declaredLength) && declaredLength > 0
          ? declaredLength
          : undefined,
    };
  }
}
