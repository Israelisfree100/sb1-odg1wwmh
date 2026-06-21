import React from 'react';

interface SummaryWidgetProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  widgetBg: string;
  borderColor?: string;
  onClick?: () => void;
}

export function SummaryWidget({
  icon,
  label,
  value,
  iconBg,
  widgetBg,
  borderColor = 'border-white/70',
  onClick,
}: SummaryWidgetProps) {
  const cls = `rounded-2xl p-4 border ${borderColor} shadow-sm flex items-center gap-3 ${widgetBg}`;
  const interactiveCls = onClick
    ? 'w-full text-right hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400'
    : '';

  const inner = (
    <>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-400 leading-tight line-clamp-1">{label}</p>
        <p className="text-sm font-bold text-gray-800 leading-snug mt-0.5 break-words">{value}</p>
      </div>
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} ${interactiveCls}`}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
