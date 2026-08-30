export const MASCOT_CHAT_STREAM_PROTOCOL = "ndjson-v1";
export const MASCOT_CHAT_STREAM_CONTENT_TYPE =
  "application/x-ndjson; charset=utf-8";

export type MascotChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "error"; code: string; message: string; retryable: boolean }
  | { type: "done" };

const encoder = new TextEncoder();

export function encodeMascotChatStreamEvent(event: MascotChatStreamEvent) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

function parseMascotChatStreamEvent(line: string): MascotChatStreamEvent {
  const value = JSON.parse(line) as Record<string, unknown>;
  if (value.type === "delta" && typeof value.text === "string") {
    return { type: "delta", text: value.text };
  }
  if (
    value.type === "error" &&
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    typeof value.retryable === "boolean"
  ) {
    return {
      type: "error",
      code: value.code,
      message: value.message,
      retryable: value.retryable,
    };
  }
  if (value.type === "done") return { type: "done" };
  throw new Error("看板娘回复流包含无法识别的数据。");
}

/**
 * NDJSON 可能在任意字节位置分块，因此必须先拼接完整行再解析。
 * 该读取器同时供浏览器实现和接口回归脚本使用。
 */
export async function* readMascotChatStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<MascotChatStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let terminalReceived = false;

  const parseLine = (line: string) => {
    if (terminalReceived) {
      throw new Error("看板娘回复流在结束事件后仍包含数据。");
    }
    const event = parseMascotChatStreamEvent(line);
    terminalReceived = event.type === "done" || event.type === "error";
    return event;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      pending += decoder.decode(value, { stream: !done });

      let newline = pending.indexOf("\n");
      while (newline >= 0) {
        const line = pending.slice(0, newline).trim();
        pending = pending.slice(newline + 1);
        if (line) yield parseLine(line);
        newline = pending.indexOf("\n");
      }

      if (done) break;
    }

    const finalLine = pending.trim();
    if (finalLine) yield parseLine(finalLine);
    if (!terminalReceived) {
      throw new Error("看板娘回复流在结束事件前提前中断。");
    }
  } finally {
    reader.releaseLock();
  }
}
