import { z } from "zod";

import type { MascotLimits } from "./limits";
import type { MascotChatInput, MascotChatMessage } from "./types";

export const MASCOT_MAX_BODY_BYTES = 24 * 1024;
export const MASCOT_TTS_MAX_BODY_BYTES = 8 * 1024;

function pageSchema() {
  return z
    .object({
      pathname: z.string().trim().min(1).max(512),
      title: z.string().trim().max(200).optional(),
      articleId: z.string().trim().max(128).optional(),
      type: z.enum(["home", "article", "project", "other"]).optional(),
    })
    .strict();
}

export function createChatRequestSchema(limits: MascotLimits) {
  return z
    .object({
      conversationId: z.uuid().optional(),
      message: z.string().trim().min(1).max(limits.maxInputChars),
      history: z
        .array(
          z
            .object({
              role: z.enum(["user", "assistant"]),
              content: z.string().trim().min(1).max(2_000),
            })
            .strict(),
        )
        .max(Math.max(2, limits.historyTurns * 2 + 2))
        .default([]),
      page: pageSchema().optional(),
    })
    .strict();
}

export function createTTSRequestSchema(limits: MascotLimits) {
  return z
    .object({
      text: z.string().trim().min(1).max(limits.ttsMaxChars),
    })
    .strict();
}

export function trimChatHistory(
  history: MascotChatMessage[],
  limits: MascotLimits,
) {
  const selected: MascotChatMessage[] = [];
  let characters = 0;
  const maxMessages = limits.historyTurns * 2;

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    if (!entry || selected.length >= maxMessages) break;
    if (characters + entry.content.length > limits.maxHistoryChars) break;
    selected.push(entry);
    characters += entry.content.length;
  }

  return selected.reverse();
}

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new RequestBodyError("INVALID_CONTENT_TYPE");
  }

  const declaredLength = Number.parseInt(
    request.headers.get("content-length") ?? "0",
    10,
  );
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestBodyError("BODY_TOO_LARGE");
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new RequestBodyError("BODY_TOO_LARGE");
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new RequestBodyError("INVALID_JSON");
  }
}

export class RequestBodyError extends Error {
  constructor(
    readonly code: "INVALID_CONTENT_TYPE" | "BODY_TOO_LARGE" | "INVALID_JSON",
  ) {
    super(code);
    this.name = "RequestBodyError";
  }
}

export function parseChatInput(
  value: unknown,
  limits: MascotLimits,
): MascotChatInput {
  const parsed = createChatRequestSchema(limits).parse(value);
  return {
    ...parsed,
    history: trimChatHistory(parsed.history, limits),
  };
}
