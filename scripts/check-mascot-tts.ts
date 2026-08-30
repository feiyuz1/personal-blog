import assert from "node:assert/strict";

import { OpenAICompatibleTTSProvider } from "../src/features/mascot/tts/openai-compatible";

type CapturedRequest = {
  input?: unknown;
  response_format?: unknown;
  stream?: unknown;
};

async function consumeAudio(
  provider: OpenAICompatibleTTSProvider,
  text: string,
  responseFormat: "mp3" | "wav" = "mp3",
) {
  const result = await provider.synthesize({
    text,
    responseFormat,
    abortSignal: new AbortController().signal,
  });
  const bytes = await new Response(result.body).arrayBuffer();
  assert.ok(bytes.byteLength > 0, "模拟音频必须完整转发");
}

async function main() {
  const originalFetch = globalThis.fetch;
  const captured: CapturedRequest[] = [];
  globalThis.fetch = async (_input, init) => {
    captured.push(JSON.parse(String(init?.body)) as CapturedRequest);
    return new Response(new Uint8Array([0x49, 0x44, 0x33, 0x03]), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": "4",
      },
    });
  };

  try {
    const cosyVoice = new OpenAICompatibleTTSProvider({
      provider: "siliconflow",
      baseUrl: "https://example.invalid/v1",
      apiKey: "test-key",
      model: "FunAudioLLM/CosyVoice2-0.5B",
      voice: "test:diana",
      stylePrompt: "自然少女音，语速均匀，句尾不要加速。",
      speed: 0.95,
    });

    await consumeAudio(cosyVoice, "这句话没有句号");
    await consumeAudio(cosyVoice, "这句话已经结束！”");
    await consumeAudio(
      cosyVoice,
      "自然少女音，语速均匀，句尾不要加速。<|endofprompt|>固定台词。",
      "wav",
    );

    assert.deepEqual(captured[0], {
      model: "FunAudioLLM/CosyVoice2-0.5B",
      input:
        "自然少女音，语速均匀，句尾不要加速。<|endofprompt|>这句话没有句号。",
      voice: "test:diana",
      speed: 0.95,
      response_format: "mp3",
      stream: false,
    });
    assert.equal(
      captured[1]?.input,
      "自然少女音，语速均匀，句尾不要加速。<|endofprompt|>这句话已经结束！”",
    );
    assert.equal(
      captured[2]?.input,
      "自然少女音，语速均匀，句尾不要加速。<|endofprompt|>固定台词。",
      "构建期 WAV 已携带风格提示，不能重复注入",
    );
    assert.equal(captured[2]?.response_format, "wav");

    console.log(
      "动态 TTS 回归通过：句末标点完整，CosyVoice 风格提示只注入一次，音频正文可转发。",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
