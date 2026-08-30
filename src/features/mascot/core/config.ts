import { getMascotName } from "./identity";
import { getMascotLimits } from "./limits";
import type { MascotFeatureConfig } from "./types";

export class MascotConfigurationError extends Error {
  constructor(
    readonly code: "AI_NOT_CONFIGURED" | "TTS_NOT_CONFIGURED",
    message: string,
  ) {
    super(message);
    this.name = "MascotConfigurationError";
  }
}

function flag(name: string, fallback: boolean) {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  if (["1", "true", "yes", "on"].includes(value)) return true;
  if (["0", "false", "no", "off"].includes(value)) return false;
  return fallback;
}

function optionalValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function normalizedBaseUrl(value: string) {
  const url = new URL(value);
  return url.toString().replace(/\/$/, "");
}

export function getMascotFeatureConfig(): MascotFeatureConfig {
  const enabled = flag("MASCOT_ENABLED", true);
  const aiEnabled = enabled && flag("MASCOT_AI_ENABLED", true);
  const ttsEnabled = enabled && flag("MASCOT_TTS_ENABLED", true);
  const aiConfigured = Boolean(
    optionalValue("AI_API_KEY") && optionalValue("AI_CHAT_MODEL"),
  );
  const ttsConfigured = Boolean(
    optionalValue("MASCOT_TTS_API_KEY", "TTS_API_KEY", "AI_API_KEY") &&
    optionalValue("MASCOT_TTS_MODEL") &&
    optionalValue("MASCOT_TTS_VOICE"),
  );

  const limits = getMascotLimits();

  return {
    mascotName: getMascotName(),
    enabled,
    live2dEnabled: enabled && flag("MASCOT_LIVE2D_ENABLED", true),
    aiEnabled,
    aiConfigured,
    ttsEnabled,
    ttsConfigured,
    memoryEnabled: enabled && flag("MASCOT_MEMORY_ENABLED", false),
    ragEnabled: enabled && flag("MASCOT_RAG_ENABLED", false),
    sttEnabled: enabled && flag("MASCOT_STT_ENABLED", false),
    maxInputChars: limits.maxInputChars,
    historyTurns: limits.historyTurns,
    maxHistoryChars: limits.maxHistoryChars,
    ttsMaxChars: limits.ttsMaxChars,
  };
}

export function getMascotAIConfig() {
  const apiKey = optionalValue("AI_API_KEY");
  const model = optionalValue("AI_CHAT_MODEL");

  if (!apiKey || !model) {
    throw new MascotConfigurationError(
      "AI_NOT_CONFIGURED",
      "AI_API_KEY and AI_CHAT_MODEL are required",
    );
  }

  return {
    provider: optionalValue("AI_PROVIDER") ?? "siliconflow",
    baseUrl: normalizedBaseUrl(
      optionalValue("AI_BASE_URL") ?? "https://api.siliconflow.cn/v1",
    ),
    apiKey,
    model,
  };
}

export function getMascotTTSConfig() {
  const apiKey = optionalValue(
    "MASCOT_TTS_API_KEY",
    "TTS_API_KEY",
    "AI_API_KEY",
  );
  const model = optionalValue("MASCOT_TTS_MODEL");
  const voice = optionalValue("MASCOT_TTS_VOICE");

  if (!apiKey || !model || !voice) {
    throw new MascotConfigurationError(
      "TTS_NOT_CONFIGURED",
      "TTS credentials, model and voice are required",
    );
  }

  const configuredSpeed = Number.parseFloat(
    optionalValue("MASCOT_TTS_SPEED") ?? "0.95",
  );

  return {
    provider: optionalValue("MASCOT_TTS_PROVIDER") ?? "siliconflow",
    baseUrl: normalizedBaseUrl(
      optionalValue("MASCOT_TTS_BASE_URL", "TTS_BASE_URL", "AI_BASE_URL") ??
        "https://api.siliconflow.cn/v1",
    ),
    apiKey,
    model,
    voice,
    // CosyVoice 的指令式音色提示；只在硅基流动动态 MP3 对话中注入。
    stylePrompt:
      optionalValue("MASCOT_TTS_STYLE_PROMPT") ??
      "自然少女音，语速均匀，句尾不要加速。",
    speed: Number.isFinite(configuredSpeed)
      ? Math.min(4, Math.max(0.25, configuredSpeed))
      : 0.95,
  };
}

export function isMascotFeatureEnabled(
  name:
    | "MASCOT_AI_ENABLED"
    | "MASCOT_TTS_ENABLED"
    | "MASCOT_MEMORY_ENABLED"
    | "MASCOT_RAG_ENABLED",
  fallback: boolean,
) {
  return flag("MASCOT_ENABLED", true) && flag(name, fallback);
}
