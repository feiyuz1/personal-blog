import "dotenv/config";

import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  MASCOT_INTERACTION_VOICE_ASSET_SHA256,
  MASCOT_INTERACTION_VOICE_VERSION,
} from "../src/features/mascot/core/interaction-voice-assets.generated";
import {
  MASCOT_INTERACTION_VOICE_PROFILE,
  MASCOT_INTERACTION_VOICES,
} from "../src/features/mascot/core/interaction-voices";
import { getMascotTTSConfig } from "../src/features/mascot/core/config";
import { createMascotTTSProvider } from "../src/features/mascot/tts";

const MAX_AUDIO_BYTES = 5_000_000;
const GENERATED_MODULE = path.join(
  process.cwd(),
  "src/features/mascot/core/interaction-voice-assets.generated.ts",
);

function normalizedManifest() {
  return {
    profile: MASCOT_INTERACTION_VOICE_PROFILE,
    voices: MASCOT_INTERACTION_VOICES.map(({ id, expression, text }) => ({
      id,
      expression,
      text: text.normalize("NFC").replace(/\s+/g, " ").trim(),
    })),
  };
}

function expectedVersion() {
  const digest = createHash("sha256")
    .update(JSON.stringify(normalizedManifest()))
    .digest("hex")
    .slice(0, 24);
  return `v1-${digest}`;
}

function audioDirectory(version: string) {
  return path.join(
    process.cwd(),
    "public",
    "mascot",
    "interaction-voice",
    version,
  );
}

function sha256(data: Uint8Array) {
  return createHash("sha256").update(data).digest("hex");
}

async function readValidAudio(file: string) {
  try {
    const info = await stat(file);
    if (info.size <= 0 || info.size > MAX_AUDIO_BYTES) return undefined;
    return await readFile(file);
  } catch {
    return undefined;
  }
}

async function checkAssets() {
  const version = expectedVersion();
  if (MASCOT_INTERACTION_VOICE_VERSION !== version) {
    throw new Error(
      "固定互动语音清单已变化，请先运行 npm run mascot:cache-voices。",
    );
  }

  const expectedHashes = MASCOT_INTERACTION_VOICE_ASSET_SHA256 as Record<
    string,
    string
  >;
  const directory = audioDirectory(version);
  for (const voice of MASCOT_INTERACTION_VOICES) {
    const file = path.join(directory, `${voice.id}.mp3`);
    const data = await readValidAudio(file);
    if (!data || sha256(data) !== expectedHashes[voice.id]) {
      throw new Error(
        `固定互动语音资源缺失或损坏：${voice.id}。请运行 npm run mascot:cache-voices。`,
      );
    }
  }

  console.log(
    `固定互动语音缓存校验通过：${MASCOT_INTERACTION_VOICES.length} 条，版本 ${version}。`,
  );
}

function assertConfiguredProfile() {
  const configured = getMascotTTSConfig();
  const actual = {
    provider: configured.provider,
    baseUrl: configured.baseUrl,
    model: configured.model,
    voice: configured.voice,
    speed: configured.speed,
    responseFormat: "mp3",
  };

  if (
    JSON.stringify(actual) !== JSON.stringify(MASCOT_INTERACTION_VOICE_PROFILE)
  ) {
    throw new Error(
      "当前 TTS 配置与固定语音 profile 不一致；请先同步 interaction-voices.ts 中的 profile。",
    );
  }
}

async function synthesizeWithRetry(
  text: string,
  provider: ReturnType<typeof createMascotTTSProvider>,
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const audio = await provider.synthesize({
        text,
        abortSignal: AbortSignal.timeout(60_000),
      });
      if (
        !audio.contentType.toLowerCase().startsWith("audio/") ||
        audio.data.byteLength <= 0 ||
        audio.data.byteLength > MAX_AUDIO_BYTES
      ) {
        throw new Error("TTS Provider 返回的音频格式或大小无效。");
      }
      return Buffer.from(audio.data);
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
      }
    }
  }
  throw lastError;
}

async function generateAssets() {
  assertConfiguredProfile();
  const version = expectedVersion();
  const directory = audioDirectory(version);
  const provider = createMascotTTSProvider();
  const hashes: Record<string, string> = {};
  await mkdir(directory, { recursive: true });

  for (const [index, voice] of MASCOT_INTERACTION_VOICES.entries()) {
    const file = path.join(directory, `${voice.id}.mp3`);
    let data = await readValidAudio(file);
    if (!data) {
      console.log(
        `正在生成固定互动语音 ${index + 1}/${MASCOT_INTERACTION_VOICES.length}：${voice.id}`,
      );
      data = await synthesizeWithRetry(voice.text, provider);
      await writeFile(file, data);
    } else {
      console.log(
        `复用固定互动语音 ${index + 1}/${MASCOT_INTERACTION_VOICES.length}：${voice.id}`,
      );
    }
    hashes[voice.id] = sha256(data);
  }

  const generatedSource = `// 由 scripts/generate-mascot-interaction-voices.ts 自动生成。
// 修改音色配置或台词后，请运行 \`npm run mascot:cache-voices\`。
export const MASCOT_INTERACTION_VOICE_VERSION = ${JSON.stringify(version)} as const;

export const MASCOT_INTERACTION_VOICE_ASSET_SHA256 = ${JSON.stringify(hashes, null, 2)} as const;
`;
  await writeFile(GENERATED_MODULE, generatedSource, "utf8");
  console.log(
    `固定互动语音已缓存：${MASCOT_INTERACTION_VOICES.length} 条，版本 ${version}。`,
  );
}

const checking = process.argv.includes("--check");

(checking ? checkAssets() : generateAssets()).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "未知错误";
  console.error(`固定互动语音处理失败：${message}`);
  process.exitCode = 1;
});
