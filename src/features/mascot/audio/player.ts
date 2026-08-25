import type { VoicePhase } from "../core/types";
import {
  MASCOT_INTERACTION_VOICE_IDS,
  getMascotInteractionVoice,
  mascotInteractionVoiceUrl,
  type MascotInteractionVoiceId,
} from "../core/interaction-voices";
import type { MascotLive2DAdapter } from "../live2d";

type AudioPlayerOptions = {
  adapter: MascotLive2DAdapter;
  maxSegmentChars: number;
  onPhaseChange: (phase: VoicePhase) => void;
};

class MascotAudioPlayerError extends Error {}

function plainTextForSpeech(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " 代码片段已省略。 ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*>]\s+/gm, "")
    .replace(/[|*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSpeechText(text: string, maxChars: number) {
  const normalized = plainTextForSpeech(text);
  if (!normalized) return [];

  const sentences = normalized.match(/[^。！？!?；;]+[。！？!?；;]?/g) ?? [
    normalized,
  ];
  const segments: string[] = [];
  let current = "";

  const pushLong = (value: string) => {
    for (let offset = 0; offset < value.length; offset += maxChars) {
      segments.push(value.slice(offset, offset + maxChars));
    }
  };

  for (const sentence of sentences) {
    const value = sentence.trim();
    if (!value) continue;
    if (value.length > maxChars) {
      if (current) segments.push(current);
      current = "";
      pushLong(value);
      continue;
    }
    if (current.length + value.length > maxChars) {
      segments.push(current);
      current = value;
    } else {
      current += value;
    }
  }
  if (current) segments.push(current);
  return segments;
}

async function getErrorMessage(response: Response) {
  const fallback = "语音暂时没有合成成功。";
  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body.message === "string" ? body.message : fallback;
  } catch {
    return fallback;
  }
}

export class MascotAudioPlayer {
  private audio?: HTMLAudioElement;
  private audioContext?: AudioContext;
  private source?: MediaElementAudioSourceNode;
  private analyser?: AnalyserNode;
  private animationFrame?: number;
  private objectUrl?: string;
  private requestController?: AbortController;
  private cancelPlayback?: () => void;
  private readonly interactionRequests = new Map<
    MascotInteractionVoiceId,
    Promise<void>
  >();
  private readonly interactionRequestController = new AbortController();
  private runId = 0;
  private reportingPhase = false;
  private smoothedMouth = 0;

  constructor(private readonly options: AudioPlayerOptions) {}

  async unlock() {
    let context = this.audioContext;
    if (!context || context.state === "closed") {
      context = new AudioContext();
      this.audioContext = context;
    }

    if (context.state === "suspended") {
      await context.resume();
    }
    if (context.state !== "running") {
      throw new MascotAudioPlayerError(
        "浏览器尚未允许播放声音，请再次点击语音按钮。",
      );
    }

    const oscillator = context.createOscillator();
    const silentGain = context.createGain();
    silentGain.gain.value = 0;
    oscillator.connect(silentGain);
    silentGain.connect(context.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      silentGain.disconnect();
    };
    oscillator.start();
    oscillator.stop(context.currentTime + 0.01);
  }

  async speak(markdown: string) {
    this.stop();
    const runId = this.runId;
    const segments = splitSpeechText(
      markdown,
      Math.max(1, this.options.maxSegmentChars),
    );
    if (segments.length === 0) return;

    try {
      this.reportingPhase = true;
      this.options.onPhaseChange("loading");
      for (const segment of segments) {
        if (runId !== this.runId) return;
        await this.playSegment(segment, runId);
      }
      if (runId === this.runId) this.options.onPhaseChange("idle");
    } catch (error) {
      if (runId !== this.runId || isAbortError(error)) return;
      this.options.onPhaseChange("error");
      throw error instanceof MascotAudioPlayerError
        ? error
        : new MascotAudioPlayerError("语音暂时不可用，请稍后再试。");
    } finally {
      if (runId === this.runId) {
        this.reportingPhase = false;
        this.releasePlaybackResources();
        this.options.adapter.setMouthOpen(0);
        this.options.adapter.setLipSyncActive?.(false);
        this.options.adapter.setState?.("idle");
      }
    }
  }

  async preloadInteractionVoices() {
    const queue = [...MASCOT_INTERACTION_VOICE_IDS];
    const worker = async () => {
      while (queue.length > 0) {
        const id = queue.shift();
        if (!id) return;
        await this.cacheInteractionVoice(id).catch(() => undefined);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(3, queue.length) }, () => worker()),
    );
  }

  async speakInteraction(id: MascotInteractionVoiceId) {
    const interruptedReportedSpeech = this.reportingPhase;
    this.cancelCurrentPlayback(true);
    this.reportingPhase = false;
    if (interruptedReportedSpeech) this.options.onPhaseChange("idle");
    const runId = this.runId;

    try {
      const unlockPromise = this.unlock();
      await this.playAudioUrl(
        mascotInteractionVoiceUrl(id),
        runId,
        getMascotInteractionVoice(id).expression,
        unlockPromise,
      );
    } catch (error) {
      if (runId !== this.runId || isAbortError(error)) return;
      throw error instanceof MascotAudioPlayerError
        ? error
        : new MascotAudioPlayerError("互动语音暂时不可用，请稍后再试。");
    } finally {
      if (runId === this.runId) {
        this.releasePlaybackResources();
        this.options.adapter.setMouthOpen(0);
        this.options.adapter.setLipSyncActive?.(false);
      }
    }
  }

  stop() {
    this.cancelCurrentPlayback(false);
    this.reportingPhase = false;
  }

  private cancelCurrentPlayback(preserveExpression: boolean) {
    this.runId += 1;
    this.requestController?.abort();
    this.requestController = undefined;
    const cancelPlayback = this.cancelPlayback;
    this.cancelPlayback = undefined;
    cancelPlayback?.();
    this.releasePlaybackResources();
    this.options.adapter.setMouthOpen(0);
    this.options.adapter.setLipSyncActive?.(false);
    if (!preserveExpression) this.options.adapter.setState?.("idle");
  }

  dispose() {
    this.stop();
    this.interactionRequestController.abort();
    this.interactionRequests.clear();
    const context = this.audioContext;
    this.audioContext = undefined;
    if (context && context.state !== "closed") void context.close();
  }

  private async playSegment(text: string, runId: number) {
    this.options.onPhaseChange("loading");
    const controller = new AbortController();
    this.requestController = controller;
    let audioBlob: Blob;
    try {
      const response = await fetch("/api/mascot/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new MascotAudioPlayerError(await getErrorMessage(response));
      }
      audioBlob = await response.blob();
    } finally {
      if (this.requestController === controller) {
        this.requestController = undefined;
      }
    }
    if (runId !== this.runId) return;

    await this.playAudioBlob(audioBlob, runId);
  }

  private async cacheInteractionVoice(id: MascotInteractionVoiceId) {
    const pending = this.interactionRequests.get(id);
    if (pending) return pending;

    const request = fetch(mascotInteractionVoiceUrl(id), {
      cache: "force-cache",
      signal: this.interactionRequestController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new MascotAudioPlayerError(await getErrorMessage(response));
        }
        const contentType = response.headers.get("content-type") ?? "";
        const audio = await response.arrayBuffer();
        if (
          audio.byteLength === 0 ||
          audio.byteLength > 5_000_000 ||
          !contentType.toLowerCase().startsWith("audio/")
        ) {
          throw new MascotAudioPlayerError("互动语音缓存内容无效。");
        }
      })
      .finally(() => {
        this.interactionRequests.delete(id);
      });

    this.interactionRequests.set(id, request);
    return request;
  }

  private async playAudioBlob(audioBlob: Blob, runId: number) {
    this.releasePlaybackResources();
    this.objectUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(this.objectUrl);
    await this.playAudioElement(audio, runId);

    if (runId === this.runId) {
      this.releasePlaybackResources();
      this.options.adapter.setMouthOpen(0);
      this.options.adapter.setLipSyncActive?.(false);
    }
  }

  private async playAudioUrl(
    url: string,
    runId: number,
    expression: string,
    unlockPromise: Promise<void>,
  ) {
    this.releasePlaybackResources();
    const audio = new Audio(url);
    await this.playAudioElement(audio, runId, expression, unlockPromise);

    if (runId === this.runId) {
      this.releasePlaybackResources();
      this.options.adapter.setMouthOpen(0);
      this.options.adapter.setLipSyncActive?.(false);
    }
  }

  private async playAudioElement(
    audio: HTMLAudioElement,
    runId: number,
    expression?: string,
    unlockPromise: Promise<void> = Promise.resolve(),
  ) {
    audio.preload = "auto";
    this.audio = audio;

    const analyserReady = this.prepareAnalyser(audio, runId);
    this.options.adapter.setLipSyncActive?.(true);
    if (expression) {
      this.options.adapter.triggerExpression?.(expression);
    } else {
      this.options.adapter.setState?.("speaking");
      this.options.onPhaseChange("speaking");
    }
    let cancelOwnPlayback: () => void = () => undefined;
    const completion = new Promise<Error | undefined>((resolve) => {
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        if (this.cancelPlayback === cancel) {
          this.cancelPlayback = undefined;
        }
        resolve(error);
      };
      const cancel = () => finish();
      cancelOwnPlayback = cancel;
      this.cancelPlayback = cancel;
      audio.onended = () => finish();
      audio.onerror = () =>
        finish(new MascotAudioPlayerError("浏览器无法播放合成语音。"));
      void audio
        .play()
        .catch(() =>
          finish(
            new MascotAudioPlayerError(
              "浏览器阻止了语音播放，请点击语音按钮后重试。",
            ),
          ),
        );
    });

    try {
      await Promise.all([unlockPromise, analyserReady]);
    } catch (error) {
      cancelOwnPlayback();
      throw error;
    }
    if (runId !== this.runId) return;

    this.startLipSync();
    const playbackError = await completion;
    if (playbackError) throw playbackError;
  }

  private async prepareAnalyser(audio: HTMLAudioElement, runId: number) {
    let context = this.audioContext;
    let createdContext = false;
    try {
      if (!context || context.state === "closed") {
        context = new AudioContext();
        createdContext = true;
      }
      if (context.state === "suspended") {
        await context.resume();
      }
      if (
        context.state !== "running" ||
        runId !== this.runId ||
        this.audio !== audio
      ) {
        if (createdContext && context.state !== "closed") {
          void context.close();
        }
        return;
      }

      const source = context.createMediaElementSource(audio);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);
      analyser.connect(context.destination);
      if (runId !== this.runId || this.audio !== audio) {
        source.disconnect();
        analyser.disconnect();
        if (createdContext) {
          void context.close();
        }
        return;
      }
      this.audioContext = context;
      this.source = source;
      this.analyser = analyser;
    } catch {
      // Web Audio 分析不可用时仍保留基础音频播放能力。
      this.source = undefined;
      this.analyser = undefined;
      if (createdContext && context && context.state !== "closed") {
        void context.close();
      }
    }
  }

  private startLipSync() {
    const analyser = this.analyser;
    if (!analyser) return;
    const samples = new Uint8Array(analyser.fftSize);
    this.smoothedMouth = 0;

    const update = () => {
      if (!this.analyser || !this.audio) return;
      if (this.audio.paused) {
        this.animationFrame = requestAnimationFrame(update);
        return;
      }
      this.analyser.getByteTimeDomainData(samples);
      let squareSum = 0;
      for (const sample of samples) {
        const centered = (sample - 128) / 128;
        squareSum += centered * centered;
      }
      const rms = Math.sqrt(squareSum / samples.length);
      const normalized = Math.max(0, Math.min(1, (rms - 0.018) * 7.5));
      this.smoothedMouth = this.smoothedMouth * 0.65 + normalized * 0.35;
      this.options.adapter.setMouthOpen(this.smoothedMouth);
      this.animationFrame = requestAnimationFrame(update);
    };
    this.animationFrame = requestAnimationFrame(update);
  }

  private releasePlaybackResources() {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
      this.audio = undefined;
    }
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.source = undefined;
    this.analyser = undefined;
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export { plainTextForSpeech, splitSpeechText };
