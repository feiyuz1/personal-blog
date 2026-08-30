import assert from "node:assert/strict";

import { OpenAICompatibleMascotProvider } from "../src/features/mascot/ai/openai-compatible";
import {
  encodeMascotChatStreamEvent,
  readMascotChatStream,
  type MascotChatStreamEvent,
} from "../src/features/mascot/core/chat-stream";
import {
  hasLikelyGenerationArtifacts,
  sanitizeGeneratedText,
} from "../src/features/mascot/core/text-quality";

async function checkFragmentedProtocol() {
  const expected: MascotChatStreamEvent[] = [
    { type: "delta", text: "你" },
    { type: "delta", text: "好" },
    { type: "done" },
  ];
  const bytes = Buffer.concat(
    expected.map((event) => Buffer.from(encodeMascotChatStreamEvent(event))),
  );
  const splitPoints = [1, 5, 9, 17, bytes.length];
  let offset = 0;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const end of splitPoints) {
        controller.enqueue(bytes.subarray(offset, end));
        offset = end;
      }
      controller.close();
    },
  });

  const actual: MascotChatStreamEvent[] = [];
  for await (const event of readMascotChatStream(body)) actual.push(event);
  assert.deepEqual(actual, expected);
}

async function checkTruncatedProtocol() {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encodeMascotChatStreamEvent({ type: "delta", text: "未完成" }),
      );
      controller.close();
    },
  });

  await assert.rejects(async () => {
    for await (const event of readMascotChatStream(body)) {
      // 消费到 EOF，读取器必须拒绝缺少 done/error 的截断流。
      assert.equal(event.type, "delta");
    }
  }, /提前中断/);
}

function checkTextSanitizer() {
  assert.equal(
    sanitizeGeneratedText("好的哦D需要D了解D问题问题问题D"),
    "好的哦需要了解问题",
  );
  assert.equal(sanitizeGeneratedText("维生素D缺乏"), "维生素D缺乏");
  assert.equal(
    sanitizeGeneratedText("维生素D缺乏，也要关注维生素D摄入和D盘空间"),
    "维生素D缺乏，也要关注维生素D摄入和D盘空间",
  );
  assert.equal(
    sanitizeGeneratedText("答案是D，选择D，然后按D键继续。"),
    "答案是D，选择D，然后按D键继续。",
  );
  assert.equal(
    sanitizeGeneratedText("第一题答案为D，第二题答案为D，第三题答案为D。"),
    "第一题答案为D，第二题答案为D，第三题答案为D。",
  );
  assert.equal(
    hasLikelyGenerationArtifacts("好的哦D需要D了解D问题问题问题D"),
    true,
  );
  assert.equal(hasLikelyGenerationArtifacts("哈哈哈，太有意思了"), false);
  assert.equal(hasLikelyGenerationArtifacts("好好好，我知道了"), false);
  assert.equal(hasLikelyGenerationArtifacts("可以可以可以，我们继续。"), false);
  assert.equal(hasLikelyGenerationArtifacts("谢谢谢谢谢谢！"), false);
  assert.equal(hasLikelyGenerationArtifacts("问题问题问题"), false);
}

async function checkProviderErrorStatus() {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  const logParts: string[] = [];
  const secretPrompt = "TOP_SECRET_PROMPT_SHOULD_NOT_LOG";

  globalThis.fetch = async () =>
    Response.json(
      { error: { message: "invalid api key", type: "authentication_error" } },
      { status: 401 },
    );
  console.error = (...values: unknown[]) => {
    logParts.push(
      values
        .map((value) =>
          typeof value === "string" ? value : JSON.stringify(value),
        )
        .join(" "),
    );
  };

  try {
    const provider = new OpenAICompatibleMascotProvider({
      provider: "test-provider",
      baseUrl: "https://example.invalid/v1",
      apiKey: "invalid-test-key",
      model: "test-model",
    });
    const response = await provider.streamChat({
      system: "test",
      messages: [{ role: "user", content: secretPrompt }],
      maxOutputTokens: 16,
      abortSignal: new AbortController().signal,
    });
    const body = (await response.json()) as { code?: unknown };
    assert.equal(response.status, 502);
    assert.equal(body.code, "AI_STREAM_FAILED");
    assert.equal(logParts.join("\n").includes(secretPrompt), false);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
}

async function checkProviderCompletion() {
  const originalFetch = globalThis.fetch;
  const sse = [
    {
      id: "chat-test",
      object: "chat.completion.chunk",
      created: 1,
      model: "test-model",
      choices: [
        {
          index: 0,
          delta: { role: "assistant", content: "你" },
          finish_reason: null,
        },
      ],
    },
    {
      id: "chat-test",
      object: "chat.completion.chunk",
      created: 1,
      model: "test-model",
      choices: [
        {
          index: 0,
          delta: { content: "好" },
          finish_reason: null,
        },
      ],
    },
    {
      id: "chat-test",
      object: "chat.completion.chunk",
      created: 1,
      model: "test-model",
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
    },
  ]
    .map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`)
    .join("");

  globalThis.fetch = async () =>
    new Response(`${sse}data: [DONE]\n\n`, {
      headers: { "Content-Type": "text/event-stream" },
    });

  let completed = 0;
  let failed = 0;
  try {
    const provider = new OpenAICompatibleMascotProvider({
      provider: "test-provider",
      baseUrl: "https://example.invalid/v1",
      apiKey: "test-key",
      model: "test-model",
    });
    const response = await provider.streamChat({
      system: "test",
      messages: [{ role: "user", content: "你好" }],
      maxOutputTokens: 16,
      abortSignal: new AbortController().signal,
      onComplete: () => {
        completed += 1;
      },
      onError: () => {
        failed += 1;
      },
    });

    const events: MascotChatStreamEvent[] = [];
    for await (const event of readMascotChatStream(response.body!)) {
      events.push(event);
    }
    assert.equal(response.status, 200);
    assert.equal(
      events
        .filter((event) => event.type === "delta")
        .map((event) => (event.type === "delta" ? event.text : ""))
        .join(""),
      "你好",
    );
    assert.deepEqual(events.at(-1), { type: "done" });
    assert.equal(completed, 1, "完整消费回复流后必须触发完成回调");
    assert.equal(failed, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function checkProviderCancellation() {
  const originalFetch = globalThis.fetch;
  const encoder = new TextEncoder();
  let upstreamAborted = 0;
  let aborted = 0;
  let completed = 0;
  let failed = 0;

  globalThis.fetch = async (_input, init) => {
    init?.signal?.addEventListener(
      "abort",
      () => {
        upstreamAborted += 1;
      },
      { once: true },
    );

    return new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          const chunk = {
            id: "chat-cancel-test",
            object: "chat.completion.chunk",
            created: 1,
            model: "test-model",
            choices: [
              {
                index: 0,
                delta: { role: "assistant", content: "开始回答" },
                finish_reason: null,
              },
            ],
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
          );
        },
      }),
      { headers: { "Content-Type": "text/event-stream" } },
    );
  };

  try {
    const provider = new OpenAICompatibleMascotProvider({
      provider: "test-provider",
      baseUrl: "https://example.invalid/v1",
      apiKey: "test-key",
      model: "test-model",
    });
    const response = await provider.streamChat({
      system: "test",
      messages: [{ role: "user", content: "请开始回答" }],
      maxOutputTokens: 16,
      abortSignal: new AbortController().signal,
      onComplete: () => {
        completed += 1;
      },
      onAbort: () => {
        aborted += 1;
      },
      onError: () => {
        failed += 1;
      },
    });

    const reader = response.body!.getReader();
    const first = await reader.read();
    assert.equal(first.done, false);
    await reader.cancel("测试客户端取消");
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    assert.equal(aborted, 1, "客户端取消后必须且只能触发一次中止回调");
    assert.equal(completed, 0);
    assert.equal(failed, 0);
    assert.equal(upstreamAborted, 1, "客户端取消后必须中止上游请求信号");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function main() {
  await checkFragmentedProtocol();
  await checkTruncatedProtocol();
  checkTextSanitizer();
  await checkProviderErrorStatus();
  await checkProviderCompletion();
  await checkProviderCancellation();
  console.log(
    "聊天流回归通过：分块解析稳定，完成与取消回调可靠，上游错误返回 502 且日志已脱敏。",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
