import React, { useState } from 'react';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { SCHOOLS } from '../data/schools';
import { login, saveSession } from '../utils/auth';
import type { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [schoolId, setSchoolId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    // Small delay for polished UX
    setTimeout(() => {
      const user = login(schoolId, username, password);
      if (user) {
        saveSession(user);
        onLogin(user);
      } else {
        setError('שם המשתמש, הסיסמה, או בית הספר שגויים. אנא נסי שוב.');
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
        {/* Logo & app name */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800">
            החבר שלי לבית הספר
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            ברוכים הבאים! נא להתחבר כדי להמשיך
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6">כניסה לתלמיד</h2>

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
                onChange={(e) => {
                  setSchoolId(e.target.value);
                  clearError();
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-800"
              >
                <option value="">— בחרי בית ספר —</option>
                {SCHOOLS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
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
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearError();
                }}
                placeholder="הזיני את שם המשתמש שלך"
                autoComplete="username"
                autoCapitalize="none"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-800 placeholder:text-gray-400"
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  placeholder="הזיני את הסיסמה שלך"
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-800 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
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
              className="w-full bg-gradient-to-l from-violet-500 to-sky-500 hover:from-violet-600 hover:to-sky-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-sm text-base mt-2"
            >
              {loading ? 'מתחבר...' : 'כניסה למערכת'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          בעיה בכניסה? פנה/י למורה או למנהל בית הספר
        </p>
      </div>
    </div>
  );
}
