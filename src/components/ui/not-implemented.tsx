interface NotImplementedProps {
  feature?: string;
}

export function NotImplemented({ feature = "该功能" }: NotImplementedProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-amber-200 bg-amber-50 p-8 text-center">
      <p className="text-sm font-semibold tracking-wider text-amber-700 uppercase">
        Coming Soon
      </p>
      <p className="mt-3 text-lg font-semibold text-slate-900">
        {feature}正在开发中
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        当前页面已完成骨架和接口声明，具体实现将在后续迭代中补齐。
        感谢你的耐心等待。
      </p>
      <div className="mt-5 inline-block rounded-full bg-amber-100 px-4 py-1.5 text-xs font-medium text-amber-700">
        Status: Not Implemented (501)
      </div>
    </div>
  );
}
