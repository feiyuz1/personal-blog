export function Pill({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "light";
}) {
  const styles = {
    default:
      "rounded-full border border-emerald-900/10 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900",
    light:
      "rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-slate-300",
  };

  return <span className={styles[variant]}>{label}</span>;
}
