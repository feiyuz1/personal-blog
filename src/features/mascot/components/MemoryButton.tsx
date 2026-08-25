export function MemoryButton({
  enabled,
  active,
  onToggle,
}: {
  enabled: boolean;
  active: boolean;
  onToggle: () => void;
}) {
  const label = enabled ? "查看长期记忆状态" : "长期记忆功能暂未开启";
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`grid size-9 place-items-center rounded-full text-base transition outline-none hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700 dark:hover:bg-slate-800 ${
        active
          ? "bg-emerald-50 text-emerald-800 dark:bg-slate-800 dark:text-emerald-300"
          : "text-slate-600 dark:text-slate-300"
      }`}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      <span aria-hidden="true">🧠</span>
    </button>
  );
}
