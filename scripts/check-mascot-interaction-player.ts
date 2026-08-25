import assert from "node:assert/strict";

import { MascotAudioPlayer } from "../src/features/mascot/audio/player";
import { mascotInteractionVoiceUrl } from "../src/features/mascot/core/interaction-voices";

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

Object.defineProperties(globalThis, {
  Audio: { configurable: true, value: FakeAudio },
  AudioContext: { configurable: true, value: FakeAudioContext },
  requestAnimationFrame: { configurable: true, value: () => 1 },
  cancelAnimationFrame: { configurable: true, value: () => undefined },
});

async function checkPlayer() {
  const expressions: string[] = [];
  const player = new MascotAudioPlayer({
    adapter: {
      dispose() {},
      setMouthOpen() {},
      setLipSyncActive() {},
      setState() {},
      triggerExpression(expression) {
        expressions.push(expression);
      },
      getLipSyncParameterIds() {
        return [];
      },
    },
    maxSegmentChars: 300,
    onPhaseChange() {},
  });

  const firstPlayback = player.speakInteraction("happy-1");
  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(FakeAudio.instances[0]?.playCalls, 1);
  assert.equal(
    FakeAudio.instances[0]?.src,
    mascotInteractionVoiceUrl("happy-1"),
  );

  const secondPlayback = player.speakInteraction("pout-2");
  assert.equal(FakeAudio.instances.length, 2);
  assert.equal(FakeAudio.instances[0]?.paused, true);
  assert.equal(FakeAudio.instances[1]?.playCalls, 1);
  assert.equal(
    FakeAudio.instances[1]?.src,
    mascotInteractionVoiceUrl("pout-2"),
  );

  FakeAudio.instances[1]?.onended?.();
  await Promise.all([firstPlayback, secondPlayback]);
  assert.deepEqual(expressions, ["happy", "pout"]);

  player.dispose();
  console.log(
    "互动语音播放器回归通过：原生点击栈内播放，连续点击最后一次优先。",
  );
}

checkPlayer().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
