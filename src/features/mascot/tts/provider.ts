export interface MascotTTSInput {
  text: string;
  abortSignal: AbortSignal;
  /**
   * 请求 Provider 返回的音频容器格式。按需 TTS 默认 `mp3`；固定语音后处理
   * 需要先拿到 PCM（`wav`）再做尾部静音与淡出，再编码为 MP3。
   */
  responseFormat?: "mp3" | "wav";
}

export interface MascotAudioResult {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength?: number;
}

export interface MascotTTSProvider {
  synthesize(input: MascotTTSInput): Promise<MascotAudioResult>;
}
