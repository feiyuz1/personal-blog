export function LoadingSpinner({
  size = "md",
  text,
}: {
  size?: "sm" | "md" | "lg";
  text?: string;
}) {
  const sizeMap = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div
        className={`animate-spin rounded-full border-2 border-slate-200 border-t-emerald-700 ${sizeMap[size]}`}
      />
      {text ? (
        <p className="text-sm text-slate-500">{text}</p>
      ) : null}
    </div>
  );
}
