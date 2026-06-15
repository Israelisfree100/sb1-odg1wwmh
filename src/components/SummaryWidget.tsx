import React from 'react';

interface SummaryWidgetProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  widgetBg: string;
  borderColor?: string;
}

export function SummaryWidget({
  icon,
  label,
  value,
  iconBg,
  widgetBg,
  borderColor = 'border-white/70',
}: SummaryWidgetProps) {
  return (
    <div
      className={`rounded-2xl p-4 border ${borderColor} shadow-sm flex items-center gap-3 ${widgetBg}`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-400 leading-tight line-clamp-1">
          {label}
        </p>
        <p className="text-sm font-bold text-gray-800 leading-snug mt-0.5 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}
