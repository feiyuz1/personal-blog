export type MascotLive2DState = "idle" | "thinking" | "speaking" | "error";

export interface MascotLive2DAdapter {
  setMouthOpen(value: number): void;
  setLipSyncActive?(active: boolean): void;
  setState?(state: MascotLive2DState): void;
  triggerMotion?(name: string): void;
  triggerExpression?(name: string): void;
  getLipSyncParameterIds?(): string[];
  dispose?(): void;
}
