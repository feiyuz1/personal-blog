type MascotBubbleProps = {
  name: string;
  visible: boolean;
  aiEnabled: boolean;
  onOpen: () => void;
};

export function MascotBubble({
  name,
  visible,
  aiEnabled,
  onOpen,
}: MascotBubbleProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      className="mascot-bubble fixed right-4 bottom-[13rem] z-50 max-w-48 rounded-2xl border border-emerald-900/10 bg-[#fffdf8]/95 px-4 py-2.5 text-left text-sm leading-5 text-slate-700 shadow-[0_12px_32px_rgba(34,58,45,0.16)] transition outline-none hover:-translate-y-0.5 hover:border-emerald-700/25 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 sm:right-[21rem] sm:bottom-[14rem] dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-100"
      onClick={onOpen}
      aria-label={aiEnabled ? `打开与${name}的聊天` : `查看${name}的聊天状态`}
    >
      <span className="block font-medium text-emerald-800 dark:text-emerald-300">
        {name}
      </span>
      <span>{aiEnabled ? "遇到问题可以问我呀。" : "聊天功能暂未开放。"}</span>
      <span className="absolute right-5 -bottom-1.5 size-3 rotate-45 border-r border-b border-emerald-900/10 bg-[#fffdf8] dark:border-white/10 dark:bg-slate-900" />
    </button>
  );
}
