export interface MascotTTSInput {
  text: string;
  abortSignal: AbortSignal;
}

export interface MascotAudioResult {
  data: ArrayBuffer;
  contentType: string;
}

export interface MascotTTSProvider {
  synthesize(input: MascotTTSInput): Promise<MascotAudioResult>;
}
