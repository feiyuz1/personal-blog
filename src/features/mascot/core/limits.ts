type MascotLimits = {
  maxInputChars: number;
  historyTurns: number;
  maxHistoryChars: number;
  maxOutputTokens: number;
  requestsPerMinute: number;
  dailyRequestLimit: number;
  ttsMaxChars: number;
  ttsDailyCharLimit: number;
};

function integerFromEnv(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

export function getMascotLimits(): MascotLimits {
  return {
    maxInputChars: integerFromEnv("MASCOT_MAX_INPUT_CHARS", 600, 1, 4_000),
    historyTurns: integerFromEnv("MASCOT_HISTORY_TURNS", 4, 0, 12),
    maxHistoryChars: integerFromEnv(
      "MASCOT_MAX_HISTORY_CHARS",
      1_600,
      0,
      12_000,
    ),
    maxOutputTokens: integerFromEnv("AI_MAX_OUTPUT_TOKENS", 384, 1, 4_096),
    requestsPerMinute: integerFromEnv("MASCOT_REQUESTS_PER_MINUTE", 8, 1, 120),
    dailyRequestLimit: integerFromEnv(
      "MASCOT_DAILY_REQUEST_LIMIT",
      30,
      1,
      10_000,
    ),
    ttsMaxChars: integerFromEnv("MASCOT_TTS_MAX_CHARS", 500, 1, 2_000),
    ttsDailyCharLimit: integerFromEnv(
      "MASCOT_TTS_DAILY_CHAR_LIMIT",
      5_000,
      1,
      100_000,
    ),
  };
}

export type { MascotLimits };
