import React from 'react';

interface NavCardProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
  iconBg: string;
  cardBg: string;
  borderColor?: string;
  onClick?: () => void;
  className?: string;
  badge?: number;
}

export function NavCard({
  title,
  icon,
  description,
  iconBg,
  cardBg,
  borderColor = 'border-white/70',
  onClick,
  className = '',
  badge,
}: NavCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-right rounded-2xl p-6 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 hover:-translate-y-0.5 border ${borderColor} ${cardBg} ${className}`}
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-3 left-3 min-w-[22px] h-[22px] bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-800 leading-snug">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-1 leading-snug">{description}</p>
      )}
    </button>
  );
}
