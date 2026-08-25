export type MascotPageType = "home" | "article" | "project" | "other";

export interface MascotPageContext {
  pathname: string;
  title?: string;
  articleId?: string;
  type?: MascotPageType;
}

export interface MascotHostContext {
  site?: {
    name?: string;
    description?: string;
  };
  page?: MascotPageContext;
  theme?: "light" | "dark";
}

export interface MascotFeatureConfig {
  mascotName: string;
  enabled: boolean;
  live2dEnabled: boolean;
  aiEnabled: boolean;
  aiConfigured: boolean;
  ttsEnabled: boolean;
  ttsConfigured: boolean;
  memoryEnabled: boolean;
  ragEnabled: boolean;
  sttEnabled: boolean;
  maxInputChars: number;
  historyTurns: number;
  maxHistoryChars: number;
  ttsMaxChars: number;
}

export type ChatPhase = "idle" | "thinking" | "streaming" | "error";

export type VoicePhase = "muted" | "idle" | "loading" | "speaking" | "error";

export type MascotChatRole = "user" | "assistant";

export interface MascotChatMessage {
  role: MascotChatRole;
  content: string;
}

export interface MascotTokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface MascotChatInput {
  conversationId?: string;
  message: string;
  history: MascotChatMessage[];
  page?: MascotPageContext;
}
