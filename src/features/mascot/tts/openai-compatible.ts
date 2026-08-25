import type {
  MascotAudioResult,
  MascotTTSInput,
  MascotTTSProvider,
} from "./provider";

type OpenAICompatibleTTSConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  voice: string;
  speed: number;
};

export class OpenAICompatibleTTSProvider implements MascotTTSProvider {
  constructor(private readonly config: OpenAICompatibleTTSConfig) {}

  async synthesize({
    text,
    abortSignal,
  }: MascotTTSInput): Promise<MascotAudioResult> {
    const response = await fetch(`${this.config.baseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        input: text,
        voice: this.config.voice,
        speed: this.config.speed,
        response_format: "mp3",
      }),
      cache: "no-store",
      signal: AbortSignal.any([abortSignal, AbortSignal.timeout(45_000)]),
    });

    const contentType = response.headers.get("content-type") ?? "audio/mpeg";
    if (!response.ok || !contentType.toLowerCase().startsWith("audio/")) {
      throw new Error(`TTS provider request failed with ${response.status}`);
    }

    const data = await response.arrayBuffer();
    if (data.byteLength === 0) {
      throw new Error("TTS provider returned empty audio");
    }

    return { data, contentType };
  }
}
