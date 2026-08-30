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
      id="waifu-tool-voice"
      type="button"
      disabled={!available}
      onClick={onToggle}
      data-voice-phase={phase}
      className={phase === "error" ? "mascot-tool-error" : undefined}
      aria-label={stateLabel}
      aria-pressed={enabled}
      title={stateLabel}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {enabled ? (
          <path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a8 8 0 0 1 0 11" />
        ) : (
          <path d="m16 9 5 6m0-6-5 6" />
        )}
      </svg>
      <span>语音</span>
    </button>
  );
}
