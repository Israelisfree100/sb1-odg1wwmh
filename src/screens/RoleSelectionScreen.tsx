import React from 'react';
import {
  GraduationCap,
  BookOpen,
  Users,
  ShieldCheck,
} from 'lucide-react';
import type { UserRole } from '../types';
import { getRoleDescription } from '../utils/roleHelpers';

interface RoleCard {
  role: UserRole;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgGrad: string;
  ring: string;
  textAccent: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    role: 'student',
    title: 'תלמידים',
    icon: <BookOpen className="w-10 h-10" />,
    color: 'text-sky-600',
    bgGrad: 'from-sky-400 to-indigo-500',
    ring: 'ring-sky-300',
    textAccent: 'bg-sky-50 border-sky-200 hover:border-sky-400 hover:shadow-sky-100',
  },
  {
    role: 'teacher',
    title: 'מורים',
    icon: <GraduationCap className="w-10 h-10" />,
    color: 'text-emerald-600',
    bgGrad: 'from-emerald-400 to-teal-500',
    ring: 'ring-emerald-300',
    textAccent: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100',
  },
  {
    role: 'parent',
    title: 'הורים',
    icon: <Users className="w-10 h-10" />,
    color: 'text-violet-600',
    bgGrad: 'from-violet-400 to-purple-500',
    ring: 'ring-violet-300',
    textAccent: 'bg-violet-50 border-violet-200 hover:border-violet-400 hover:shadow-violet-100',
  },
  {
    role: 'school_admin',
    title: 'הנהלת בית הספר',
    icon: <ShieldCheck className="w-10 h-10" />,
    color: 'text-slate-700',
    bgGrad: 'from-slate-500 to-indigo-600',
    ring: 'ring-slate-300',
    textAccent: 'bg-slate-50 border-slate-200 hover:border-slate-400 hover:shadow-slate-100',
  },
];

interface RoleSelectionScreenProps {
  onSelectRole: (role: UserRole) => void;
}

export function RoleSelectionScreen({ onSelectRole }: RoleSelectionScreenProps) {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 flex flex-col items-center justify-center px-4 py-10 font-sans"
    >
      {/* App logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center shadow-lg mb-4">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>
        <p className="text-sm font-semibold text-gray-400 tracking-wide">
          החבר שלי לבית הספר
        </p>
      </div>

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-800 leading-tight mb-2">
          ברוכים הבאים למערכת הבית־ספרית
        </h1>
        <p className="text-gray-500 text-base">
          בחרו את אזור הכניסה שלכם
        </p>
      </div>

      {/* Role cards grid */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-5">
        {ROLE_CARDS.map((card) => (
          <button
            key={card.role}
            onClick={() => onSelectRole(card.role)}
            aria-label={`כניסה ל${card.title}`}
            className={`group flex flex-col items-center text-center p-7 rounded-2xl border-2 bg-white shadow-sm transition-all duration-200 cursor-pointer
              focus-visible:outline-none focus-visible:ring-4 ${card.ring}
              ${card.textAccent}
              hover:-translate-y-1 hover:shadow-lg active:scale-95`}
          >
            {/* Icon in gradient bubble */}
            <div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${card.bgGrad} flex items-center justify-center text-white shadow-md mb-5 transition-transform group-hover:scale-105`}
            >
              {card.icon}
            </div>
            <h2 className={`text-xl font-extrabold mb-2 ${card.color}`}>
              {card.title}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {getRoleDescription(card.role)}
            </p>
            <span className={`mt-4 inline-block px-4 py-1.5 rounded-full text-xs font-bold ${card.color} bg-white border border-current opacity-70 group-hover:opacity-100 transition-opacity`}>
              כניסה →
            </span>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-10">
        בעיה בכניסה? פנה/י למורה או למנהל בית הספר
      </p>
    </div>
  );
}
