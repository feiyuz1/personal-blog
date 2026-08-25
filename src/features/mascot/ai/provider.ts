import type { MascotChatMessage, MascotTokenUsage } from "../core/types";

export interface MascotAIStreamInput {
  system: string;
  messages: MascotChatMessage[];
  maxOutputTokens: number;
  abortSignal: AbortSignal;
  onUsage?: (usage: MascotTokenUsage) => void;
  onComplete?: () => void;
  onAbort?: () => void;
  onError?: () => void;
}

export interface MascotAIProvider {
  streamChat(input: MascotAIStreamInput): Promise<Response>;
}
