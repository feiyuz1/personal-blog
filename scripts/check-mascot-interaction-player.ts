import assert from "node:assert/strict";

import { MascotAudioPlayer } from "../src/features/mascot/audio/player";
import {
  MASCOT_INTERACTION_VOICE_IDS,
  mascotInteractionVoiceUrl,
} from "../src/features/mascot/core/interaction-voices";

class FakeAudio {
  static readonly instances: FakeAudio[] = [];

  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  paused = true;
  preload = "";
  playCalls = 0;

  constructor(readonly src: string) {
    FakeAudio.instances.push(this);
  }

  play() {
    this.paused = false;
    this.playCalls += 1;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  removeAttribute() {}
  load() {}
}

class FakeAudioContext {
  state: AudioContextState = "running";
  currentTime = 0;
  destination = {};

  createOscillator() {
    const oscillator = {
      onended: null as (() => void) | null,
      connect() {},
      disconnect() {},
      start() {},
      stop() {
        queueMicrotask(() => oscillator.onended?.());
      },
    };
    return oscillator;
  }

  createGain() {
    return {
      gain: { value: 0 },
      connect() {},
      disconnect() {},
    };
  }

  createMediaElementSource() {
    return { connect() {}, disconnect() {} };
  }

  createAnalyser() {
    return {
      fftSize: 512,
      smoothingTimeConstant: 0.2,
      connect() {},
      disconnect() {},
      getByteTimeDomainData(samples: Uint8Array) {
        samples.fill(128);
      },
    };
  }

  async resume() {
    this.state = "running";
  }

  async close() {
    this.state = "closed";
  }
}

class FakeMediaSource extends EventTarget {
  static readonly instances: FakeMediaSource[] = [];
  static isTypeSupported() {
    return true;
  }

  readyState: ReadyState = "closed";

  constructor() {
    super();
    FakeMediaSource.instances.push(this);
  }

  addSourceBuffer(): never {
    throw new Error("取消测试不应执行到 addSourceBuffer");
  }
}

Object.defineProperties(globalThis, {
  Audio: { configurable: true, value: FakeAudio },
  AudioContext: { configurable: true, value: FakeAudioContext },
  requestAnimationFrame: { configurable: true, value: () => 1 },
  cancelAnimationFrame: { configurable: true, value: () => undefined },
  MediaSource: { configurable: true, value: FakeMediaSource },
});
Object.defineProperties(URL, {
  createObjectURL: { configurable: true, value: () => "blob:mascot-test" },
  revokeObjectURL: { configurable: true, value: () => undefined },
});

async function waitForMediaSource() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (FakeMediaSource.instances.length > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("动态语音没有进入 MediaSource 播放路径");
}

async function checkPlayer() {
  const originalFetch = globalThis.fetch;
  const cachedUrls: string[] = [];
  const mouthValues: number[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/interaction-voice/")) cachedUrls.push(url);
    return new Response(new Uint8Array([1]), {
      headers: { "Content-Type": "audio/mpeg" },
    });
  };
  const player = new MascotAudioPlayer({
    adapter: {
      dispose() {},
      setMouthOpen(value) {
        mouthValues.push(value);
      },
      setLipSyncActive() {},
      setState() {},
      getLipSyncParameterIds() {
        return [];
      },
    },
    maxSegmentChars: 300,
    tailHoldMs: 10,
    onPhaseChange() {},
  });

  try {
    const cancelledPlayback = player.speak("测试流式语音取消。");
    await waitForMediaSource();
    player.stop();
    await Promise.race([
      cancelledPlayback,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("流式取消后播放器仍在等待")), 500),
      ),
    ]);

    await player.preloadInteractionVoices();
    await player.preloadInteractionVoices();
    assert.equal(cachedUrls.length, MASCOT_INTERACTION_VOICE_IDS.length);
    assert.equal(new Set(cachedUrls).size, MASCOT_INTERACTION_VOICE_IDS.length);

    const interactionStart = FakeAudio.instances.length;
    const firstPlayback = player.speakInteraction("happy-1");
    assert.equal(FakeAudio.instances.length, interactionStart + 1);
    assert.equal(FakeAudio.instances[interactionStart]?.playCalls, 1);
    assert.equal(
      FakeAudio.instances[interactionStart]?.src,
      mascotInteractionVoiceUrl("happy-1"),
    );

    const secondPlayback = player.speakInteraction("pout-2");
    assert.equal(FakeAudio.instances.length, interactionStart + 2);
    assert.equal(FakeAudio.instances[interactionStart]?.paused, true);
    assert.equal(FakeAudio.instances[interactionStart + 1]?.playCalls, 1);
    assert.equal(
      FakeAudio.instances[interactionStart + 1]?.src,
      mascotInteractionVoiceUrl("pout-2"),
    );

    FakeAudio.instances[interactionStart + 1]?.onended?.();
    await Promise.all([firstPlayback, secondPlayback]);
    assert.equal(mouthValues.at(-1), 0, "音频结束后口型必须平滑收拢到闭合状态");
  } finally {
    player.dispose();
    globalThis.fetch = originalFetch;
  }

  console.log(
    "语音播放器回归通过：流式首播可取消，缓存不重复请求，连续点击最后一次优先，句尾口型可正常收拢。",
  );
}

checkPlayer().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
