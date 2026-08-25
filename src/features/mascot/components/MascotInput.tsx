import type { FormEvent, KeyboardEvent } from "react";

type MascotInputProps = {
  mascotName: string;
  value: string;
  maxLength: number;
  disabled: boolean;
  generating: boolean;
  placeholder: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function MascotInput({
  mascotName,
  value,
  maxLength,
  disabled,
  generating,
  placeholder,
  onChange,
  onSubmit,
  onCancel,
}: MascotInputProps) {
  const canSubmit = !disabled && !generating && value.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit) onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (canSubmit) onSubmit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className="border-t border-emerald-950/10 bg-[#fffdf8] p-3 dark:border-white/10 dark:bg-slate-900"
    >
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 transition focus-within:border-emerald-600/50 focus-within:ring-2 focus-within:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-950">
        <textarea
          value={value}
          maxLength={maxLength}
          rows={2}
          disabled={disabled || generating}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={`和${mascotName}说点什么`}
          className="max-h-28 min-h-11 flex-1 resize-none bg-transparent text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {generating ? (
          <button
            type="button"
            onClick={onCancel}
            className="mb-1 grid size-9 shrink-0 place-items-center rounded-full bg-slate-700 text-white transition outline-none hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:bg-slate-200 dark:text-slate-900"
            aria-label="停止生成"
            title="停止生成"
          >
            <span
              className="size-2.5 rounded-sm bg-current"
              aria-hidden="true"
            />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className="mb-1 grid size-9 shrink-0 place-items-center rounded-full bg-emerald-700 text-white transition outline-none hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
            aria-label="发送消息"
            title="发送消息"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m4 4 16 8-16 8 3-8-3-8Z" />
              <path d="M7 12h13" />
            </svg>
          </button>
        )}
      </div>
      <div className="mt-1.5 flex justify-between px-1 text-[11px] text-slate-400 dark:text-slate-500">
        <span>Enter 发送 · Shift + Enter 换行</span>
        <span aria-live="polite">{maxLength - value.length}</span>
      </div>
    </form>
  );
}
