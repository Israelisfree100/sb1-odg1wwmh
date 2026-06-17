import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { SCHOOLS } from '../data/schools';
import { login, saveSession } from '../utils/auth';
import type { User, UserRole } from '../types';
import { getRoleLoginTitle } from '../utils/roleHelpers';

// ─── Role-specific theme config ───────────────────────────────────────────────

interface RoleTheme {
  icon: React.ReactNode;
  gradient: string;
  ring: string;
}

function getRoleTheme(role: UserRole): RoleTheme {
  switch (role) {
    case 'teacher':
      return {
        icon: <GraduationCap className="w-9 h-9 text-white" />,
        gradient: 'from-emerald-500 to-teal-500',
        ring: 'focus:ring-emerald-400',
      };
    case 'parent':
      return {
        icon: <Users className="w-9 h-9 text-white" />,
        gradient: 'from-violet-500 to-purple-500',
        ring: 'focus:ring-violet-400',
      };
    case 'school_admin':
      return {
        icon: <ShieldCheck className="w-9 h-9 text-white" />,
        gradient: 'from-slate-600 to-indigo-600',
        ring: 'focus:ring-slate-400',
      };
    default: // student
      return {
        icon: <BookOpen className="w-9 h-9 text-white" />,
        gradient: 'from-sky-500 to-indigo-500',
        ring: 'focus:ring-sky-400',
      };
  }
}

function getBtnGradient(role: UserRole): string {
  switch (role) {
    case 'teacher': return 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600';
    case 'parent': return 'from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600';
    case 'school_admin': return 'from-slate-600 to-indigo-600 hover:from-slate-700 hover:to-indigo-700';
    default: return 'from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600';
  }
}

// ─── Dev-only credentials per role ───────────────────────────────────────────

interface DemoCred {
  school: string;
  credential: string;
}

function getDevCreds(role: UserRole): DemoCred[] {
  switch (role) {
    case 'student':
      return [
        { school: 'בית ספר השקד', credential: 'alma / 1234' },
        { school: 'בית ספר השקד', credential: 'noam / 1234' },
        { school: 'בית ספר הרקפות', credential: 'maya / 1234' },
        { school: 'בית ספר רמת אביב ג׳', credential: 'alma-rag / 1234' },
      ];
    case 'teacher':
      return [
        { school: 'בית ספר השקד', credential: 'teacher-shaked / 1234' },
        { school: 'בית ספר הרקפות', credential: 'teacher-rakafot / 1234' },
        { school: 'בית ספר רמת אביב ג׳', credential: 'teacher-rag / 1234' },
      ];
    case 'parent':
      return [
        { school: 'בית ספר השקד', credential: 'parent-alma / 1234' },
        { school: 'בית ספר הרקפות', credential: 'parent-maya / 1234' },
        { school: 'בית ספר רמת אביב ג׳', credential: 'parent-rag / 1234' },
      ];
    case 'school_admin':
      return [
        { school: 'בית ספר השקד', credential: 'admin-shaked / 1234' },
        { school: 'בית ספר הרקפות', credential: 'admin-rakafot / 1234' },
        { school: 'בית ספר רמת אביב ג׳', credential: 'admin-rag / 1234' },
      ];
    default:
      return [];
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface LoginScreenProps {
  selectedRole: UserRole;
  onLogin: (user: User) => void;
  onBack: () => void;
}

export function LoginScreen({ selectedRole, onLogin, onBack }: LoginScreenProps) {
  const [schoolId, setSchoolId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const theme = getRoleTheme(selectedRole);
  const title = getRoleLoginTitle(selectedRole);
  const btnGrad = getBtnGradient(selectedRole);
  const creds = getDevCreds(selectedRole);

  const clearError = () => setError('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!schoolId) {
      setError('יש לבחור בית ספר מהרשימה');
      return;
    }
    if (!username.trim()) {
      setError('יש להזין שם משתמש');
      return;
    }
    if (!password) {
      setError('יש להזין סיסמה');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const user = login(schoolId, username, password, selectedRole);
      if (user) {
        saveSession(user);
        onLogin(user);
      } else {
        setError('פרטי הכניסה אינם מתאימים לאזור שנבחר');
      }
      setLoading(false);
    }, 350);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 font-sans flex items-center justify-center px-4 py-8"
    >
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
          aria-label="חזרה לבחירת אזור"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          חזרה לבחירת אזור
        </button>

        {/* Logo & role title */}
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}
          >
            {theme.icon}
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800">
            {title}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            ברוכים הבאים! נא להתחבר כדי להמשיך
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* School selector */}
            <div>
              <label
                htmlFor="school"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                בית ספר
              </label>
              <select
                id="school"
                value={schoolId}
                onChange={(e) => { setSchoolId(e.target.value); clearError(); }}
                className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 ${theme.ring} text-gray-800`}
              >
                <option value="">— בחר/י בית ספר —</option>
                {SCHOOLS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                שם משתמש
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); clearError(); }}
                placeholder="הזינו את שם המשתמש"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ${theme.ring} text-gray-800 placeholder:text-gray-400`}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                סיסמה
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder="הזינו את הסיסמה"
                  autoComplete="current-password"
                  autoCorrect="off"
                  spellCheck={false}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:ring-2 ${theme.ring} text-gray-800 placeholder:text-gray-400`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 font-medium"
              >
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-l ${btnGrad} disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-sm text-base mt-2`}
            >
              {loading ? 'מתחבר...' : 'כניסה למערכת'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          בעיה בכניסה? פנה/י למורה או למנהל בית הספר
        </p>

        {/* Demo credentials — development only */}
        {import.meta.env.DEV && creds.length > 0 && (
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm" dir="rtl">
            <p className="font-bold text-amber-800 mb-2 flex items-center gap-1.5">
              <span>🔑</span> פרטי כניסה לדוגמה — {title}
            </p>
            <div className="space-y-1.5 text-amber-700">
              {creds.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-xs">{c.school}</span>
                  <code className="bg-amber-100 rounded-lg px-2 py-0.5 text-xs font-mono">
                    {c.credential}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
