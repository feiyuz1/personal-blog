import type { VoicePhase } from "../core/types";

export function VoiceButton({
  mascotName,
  available,
  enabled,
  phase,
  onToggle,
}: {
  mascotName: string;
  available: boolean;
  enabled: boolean;
  phase: VoicePhase;
  onToggle: () => void;
}) {
  const stateLabel = !available
    ? "语音服务未启用或尚未配置"
    : enabled
      ? phase === "speaking"
        ? `${mascotName}正在朗读，点击关闭语音`
        : phase === "loading"
          ? "正在准备语音，点击关闭语音"
          : phase === "error"
            ? "语音暂时不可用，点击关闭语音"
            : "语音已开启，点击关闭"
      : "语音已关闭，点击开启";

  return (
    <button
      type="button"
      disabled={!available}
      onClick={onToggle}
      className={`grid size-9 place-items-center rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 ${
        phase === "error"
          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
          : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
      aria-label={stateLabel}
      aria-pressed={enabled}
      title={stateLabel}
    >
      <span aria-hidden="true">{enabled ? "🔊" : "🔇"}</span>
    </button>
  );
}
