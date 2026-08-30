import type { MascotLive2DAdapter, MascotLive2DState } from "./adapter";

type MascotLive2DRuntime = {
  setMouthOpen(value: number): void;
  setLipSyncActive(active: boolean): void;
  setState(state: MascotLive2DState): void;
  triggerMotion(name: string): void;
  triggerExpression(name: string): void;
  getLipSyncParameterIds(): string[];
};

declare global {
  interface Window {
    __MASCOT_LIVE2D_RUNTIME__?: MascotLive2DRuntime;
  }
}

export class CurrentLive2DAdapter implements MascotLive2DAdapter {
  private mouthOpen = 0;
  private lipSyncActive = false;
  private state: MascotLive2DState = "idle";
  private disposed = false;

  connect() {
    if (typeof window !== "undefined") {
      this.disposed = false;
      window.addEventListener("mascot:live2d-ready", this.handleRuntimeReady);
    }
  }

  setMouthOpen(value: number) {
    this.mouthOpen = Number.isFinite(value)
      ? Math.max(0, Math.min(1, value))
      : 0;
    this.runtime()?.setMouthOpen(this.mouthOpen);
  }

  setLipSyncActive(active: boolean) {
    this.lipSyncActive = active;
    this.runtime()?.setLipSyncActive(active);
  }

  setState(state: MascotLive2DState) {
    this.state = state;
    this.runtime()?.setState(state);
  }

  triggerMotion(name: string) {
    this.runtime()?.triggerMotion(name);
  }

  triggerExpression(name: string) {
    this.runtime()?.triggerExpression(name);
  }

  getLipSyncParameterIds() {
    return this.runtime()?.getLipSyncParameterIds() ?? [];
  }

  dispose() {
    if (this.disposed) return;
    this.setMouthOpen(0);
    this.setLipSyncActive(false);
    this.setState("idle");
    window.removeEventListener("mascot:live2d-ready", this.handleRuntimeReady);
    this.disposed = true;
  }

  private readonly handleRuntimeReady = () => {
    if (this.disposed) return;
    const runtime = this.runtime();
    runtime?.setState(this.state);
    runtime?.setLipSyncActive(this.lipSyncActive);
    runtime?.setMouthOpen(this.mouthOpen);
  };

  private runtime() {
    return typeof window === "undefined"
      ? undefined
      : window.__MASCOT_LIVE2D_RUNTIME__;
  }
}
