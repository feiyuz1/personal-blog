/**
 * 固定互动语音的音频后处理（构建期专用，仅在生成脚本中使用）。
 *
 * 链路：TTS Provider 返回 WAV（16-bit PCM）→ 解码为单声道 PCM →
 * 定位最后有效声音 → 去掉 Provider 自带的不定长尾部 → 末段线性淡出 →
 * 追加固定静音 → 重新编码为 MP3。
 *
 * 这样可以稳定保证每条缓存语音都带有一段完整安静的收尾，避免
 * 「最后一个字被吞 / 句尾仓促 / 尾部爆音」的问题；这些参数同时
 * 参与缓存版本指纹，调整后会自动生成新版本目录。
 *
 * 该模块依赖 Node Buffer 与 @breezystack/lamejs，不要在浏览器端引用。
 *
 * lamejs 通过动态 import() 加载：tsx 把本脚本按 CJS 输出，静态命名导入会
 * 退化成 require() 命中 iife 构建（该构建不挂 module.exports，返回空对象）；
 * 而动态 import() 走 Node ESM 加载器，命中带命名导出的 ESM 构建。
 */

/** lamejs 模块缓存，避免 20 条语音重复解析。 */
let lamejsPromise: Promise<typeof import("@breezystack/lamejs")> | undefined;
function loadLamejs() {
  if (!lamejsPromise) lamejsPromise = import("@breezystack/lamejs");
  return lamejsPromise;
}

/** #6 构建期约束：缓存语音末尾必须存在至少这么长的低电平尾部。 */
const TAIL_ASSERT_MS = 250;
/** 视为「低电平 / 静音」的样本绝对值上限（int16 量程，约 -58 dBFS）。 */
const TAIL_ASSERT_THRESHOLD = 50;
const AUDIBLE_WINDOW_MS = 5;
/** MP3 比特率；单声道语音用 96 kbps 已足够且文件更小。 */
const MP3_KBPS = 96;
/** lamejs 单次编码块大小（MPEG Layer III 帧长）。 */
const MP3_BLOCK = 1152;
const SUPPORTED_SAMPLE_RATES = new Set([
  8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000,
]);

export interface InteractionVoicePostProcessOptions {
  /** 5ms 窗口 RMS 的有效声音阈值（int16 量程），纳入版本指纹。 */
  audibleRmsThreshold: number;
  /** 按台词长度计算的最大合理时长，超出时触发重新合成。 */
  maxDurationMs: number;
  /** 末尾追加的静音时长（毫秒），纳入版本指纹。 */
  tailSilenceMs: number;
  /** 末段淡出时长（毫秒），用于平滑句尾、避免爆音，纳入版本指纹。 */
  fadeOutMs: number;
}

function readFourCC(buffer: Buffer, offset: number) {
  return buffer.toString("latin1", offset, offset + 4);
}

interface DecodedWav {
  samples: Int16Array;
  sampleRate: number;
}

/**
 * 解析 RIFF/WAVE 容器，取出 16-bit PCM 数据并下混为单声道。
 * 支持任意声道数（>1 时按均值下混）；只接受 PCM 16-bit。
 */
function decodeWavPcm(buffer: Buffer): DecodedWav {
  if (buffer.length < 44) {
    throw new Error("WAV 数据过短，无法解析头部。");
  }
  if (readFourCC(buffer, 0) !== "RIFF" || readFourCC(buffer, 8) !== "WAVE") {
    throw new Error("返回的音频不是 RIFF/WAVE 容器。");
  }

  let offset = 12;
  let audioFormat = 0;
  let numChannels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataOffset = -1;
  let dataLength = 0;

  while (offset + 8 <= buffer.length) {
    const id = readFourCC(buffer, offset);
    const size = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    if (id === "fmt ") {
      audioFormat = buffer.readUInt16LE(dataStart);
      numChannels = buffer.readUInt16LE(dataStart + 2);
      sampleRate = buffer.readUInt32LE(dataStart + 4);
      bitsPerSample = buffer.readUInt16LE(dataStart + 14);
    } else if (id === "data") {
      dataOffset = dataStart;
      dataLength = size;
    }
    // 子块按字对齐（size 为奇数时补一个 padding 字节）。
    offset = dataStart + size + (size % 2);
    if (dataOffset >= 0 && audioFormat !== 0) break;
  }

  if (audioFormat !== 1) {
    throw new Error(`仅支持 16-bit PCM WAV，当前 audioFormat=${audioFormat}。`);
  }
  if (bitsPerSample !== 16) {
    throw new Error(
      `仅支持 16-bit PCM WAV，当前 bitsPerSample=${bitsPerSample}。`,
    );
  }
  if (numChannels < 1) {
    throw new Error(`WAV 声道数无效：${numChannels}。`);
  }
  if (dataOffset < 0) {
    throw new Error("WAV 缺少 data 块。");
  }

  dataLength = Math.min(dataLength, buffer.length - dataOffset);
  const bytesPerFrame = numChannels * 2;
  const frameCount = Math.floor(dataLength / bytesPerFrame);
  const samples = new Int16Array(frameCount);
  for (let i = 0; i < frameCount; i += 1) {
    const base = dataOffset + i * bytesPerFrame;
    let sum = 0;
    for (let channel = 0; channel < numChannels; channel += 1) {
      sum += buffer.readInt16LE(base + channel * 2);
    }
    samples[i] = Math.round(sum / numChannels);
  }

  return { samples, sampleRate };
}

/** 把单声道 16-bit PCM 编码为 MP3。 */
async function encodeMp3(
  samples: Int16Array,
  sampleRate: number,
): Promise<Buffer> {
  if (!SUPPORTED_SAMPLE_RATES.has(sampleRate)) {
    throw new Error(`MP3 编码不支持采样率 ${sampleRate}。`);
  }
  const { Mp3Encoder } = await loadLamejs();
  const encoder = new Mp3Encoder(1, sampleRate, MP3_KBPS);
  const chunks: Buffer[] = [];
  for (let i = 0; i < samples.length; i += MP3_BLOCK) {
    const block = samples.subarray(i, i + MP3_BLOCK);
    const encoded = encoder.encodeBuffer(block);
    if (encoded.length > 0) chunks.push(Buffer.from(encoded));
  }
  const flushed = encoder.flush();
  if (flushed.length > 0) chunks.push(Buffer.from(flushed));
  return Buffer.concat(chunks);
}

/**
 * 对原始句尾做线性淡出，把最后 fadeOutMs 的样本从满幅降到 0，
 * 避免句尾硬切产生的爆音。淡出只作用于原始语音尾部，不波及后续静音。
 */
function applyFadeOut(
  samples: Int16Array,
  fadeOutMs: number,
  sampleRate: number,
) {
  const fadeSamples = Math.round((fadeOutMs / 1000) * sampleRate);
  const fadeLen = Math.min(fadeSamples, samples.length);
  if (fadeLen <= 0) return;
  const fadeStart = samples.length - fadeLen;
  for (let i = 0; i < fadeLen; i += 1) {
    const gain = 1 - i / fadeLen;
    samples[fadeStart + i] = Math.round(samples[fadeStart + i] * gain);
  }
}

/**
 * 从尾部按短窗扫描最后一段有效声音，去掉 Provider 自带的随机长度静音。
 * 使用 RMS 而不是单样本峰值，避免极小的编码噪点把静音误判成语音。
 */
function trimAfterLastAudibleWindow(
  samples: Int16Array,
  sampleRate: number,
  audibleRmsThreshold: number,
) {
  const windowSize = Math.max(
    1,
    Math.round((AUDIBLE_WINDOW_MS / 1000) * sampleRate),
  );

  for (let end = samples.length; end > 0; end -= windowSize) {
    const start = Math.max(0, end - windowSize);
    let squareSum = 0;
    for (let index = start; index < end; index += 1) {
      const value = samples[index] ?? 0;
      squareSum += value * value;
    }
    const rms = Math.sqrt(squareSum / Math.max(1, end - start));
    if (rms >= audibleRmsThreshold) {
      return samples.slice(0, end);
    }
  }

  throw new Error("TTS 返回的 WAV 没有检测到有效声音。");
}

/**
 * 断言后处理后的 PCM 末尾存在 ≥ TAIL_ASSERT_MS 的低电平尾部（#6）。
 * 因为静音是显式追加的，这里是对后处理管线本身的健全性校验：
 * 一旦静音追加失败或被意外截断，生成会在此失败而不是写出坏文件。
 */
function assertLowLevelTail(samples: Int16Array, sampleRate: number) {
  const assertSamples = Math.round((TAIL_ASSERT_MS / 1000) * sampleRate);
  if (samples.length < assertSamples) {
    throw new Error(
      `尾部静音断言失败：音频总长不足 ${TAIL_ASSERT_MS}ms，无法满足收尾要求。`,
    );
  }
  let peak = 0;
  for (let i = samples.length - assertSamples; i < samples.length; i += 1) {
    const value = Math.abs(samples[i]);
    if (value > peak) peak = value;
  }
  if (peak >= TAIL_ASSERT_THRESHOLD) {
    throw new Error(
      `尾部静音断言失败：末尾 ${TAIL_ASSERT_MS}ms 存在非低电平样本（峰值 ${peak}），未达到安静收尾。`,
    );
  }
}

/**
 * 后处理固定互动语音：WAV → 追加尾部静音 + 末段淡出 → 编码 MP3。
 * 返回可直接写盘的 MP3 Buffer。异步：内部动态加载 lamejs。
 */
export async function postProcessInteractionVoice(
  wav: Buffer,
  options: InteractionVoicePostProcessOptions,
): Promise<Buffer> {
  const { audibleRmsThreshold, maxDurationMs, tailSilenceMs, fadeOutMs } =
    options;
  if (audibleRmsThreshold <= 0) {
    throw new Error("audibleRmsThreshold 必须大于 0。");
  }
  if (maxDurationMs <= 0) {
    throw new Error("maxDurationMs 必须大于 0。");
  }
  if (tailSilenceMs < TAIL_ASSERT_MS) {
    throw new Error(
      `tailSilenceMs=${tailSilenceMs} 小于构建约束 ${TAIL_ASSERT_MS}ms，固定语音必须保留更长的安静收尾。`,
    );
  }

  const { samples, sampleRate } = decodeWavPcm(wav);
  if (samples.length === 0) {
    throw new Error("TTS 返回的 WAV 不含音频数据。");
  }
  const durationMs = (samples.length / sampleRate) * 1_000;
  if (durationMs > maxDurationMs) {
    throw new Error(
      `固定语音时长异常：${Math.round(durationMs)}ms，超过 ${maxDurationMs}ms。`,
    );
  }

  const audibleSamples = trimAfterLastAudibleWindow(
    samples,
    sampleRate,
    audibleRmsThreshold,
  );
  applyFadeOut(audibleSamples, fadeOutMs, sampleRate);

  const silenceSamples = Math.round((tailSilenceMs / 1000) * sampleRate);
  const processed = new Int16Array(audibleSamples.length + silenceSamples);
  processed.set(audibleSamples, 0);

  assertLowLevelTail(processed, sampleRate);

  return encodeMp3(processed, sampleRate);
}
