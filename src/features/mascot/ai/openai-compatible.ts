import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, type ModelMessage } from "ai";

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

    const result = streamText({
      model: provider.chatModel(this.config.model),
      system: input.system,
      messages,
      maxOutputTokens: input.maxOutputTokens,
      maxRetries: 1,
      temperature: 0.35,
      topP: 0.8,
      frequencyPenalty: 0.15,
      abortSignal: input.abortSignal,
      timeout: 60_000,
      onEnd: ({ usage }) => {
        input.onUsage?.({
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
        });
        input.onComplete?.();
      },
      onAbort: () => {
        input.onAbort?.();
      },
      onError: () => {
        console.error("Mascot AI stream failed.");
        input.onError?.();
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}
