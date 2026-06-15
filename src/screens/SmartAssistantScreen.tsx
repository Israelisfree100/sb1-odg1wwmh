import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronRight,
  LogOut,
  Send,
  Trash2,
  Sparkles,
} from 'lucide-react';
import type { User, ChatMessage } from '../types';
import { getSchool, getInitials } from '../utils/dataHelpers';
import { askAssistant } from '../services/studentAssistant';

// ─── localStorage helpers ──────────────────────────────────────────────────────

const CHAT_PREFIX = 'student_assistant_chat_';

function loadChat(userId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_PREFIX + userId);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveChat(userId: string, messages: ChatMessage[]): void {
  try {
    localStorage.setItem(
      CHAT_PREFIX + userId,
      JSON.stringify(messages.slice(-120)),
    );
  } catch {
    // ignore
  }
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function makeWelcome(firstName: string): ChatMessage {
  return {
    id: 'welcome-' + genId(),
    role: 'assistant',
    content: `היי ${firstName} 👋 אני כאן כדי לעזור לך עם מערכת השעות, המשימות, המבחנים והודעות בית הספר. אפשר לשאול אותי כל שאלה!`,
    timestamp: Date.now(),
  };
}

// ─── Quick questions ──────────────────────────────────────────────────────────

const QUICK_QUESTIONS = [
  'מה יש לי היום?',
  'מה השיעור הבא?',
  'מה צריך להביא מחר?',
  'יש לי שיעורי בית?',
  'מתי המבחן הבא?',
  'יש הודעה חשובה?',
  'מישהו מצא קלמר?',
  'כמה משימות נשארו לי?',
];

// ─── Time formatter ───────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  activeUser: User;
  onBack: () => void;
  onLogout: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SmartAssistantScreen({ activeUser, onBack, onLogout }: Props) {
  const school = getSchool(activeUser.schoolId);
  const initials = getInitials(activeUser.fullName);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadChat(activeUser.id);
    if (saved.length === 0) {
      const welcome = makeWelcome(activeUser.firstName);
      saveChat(activeUser.id, [welcome]);
      return [welcome];
    }
    return saved;
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: ChatMessage = {
        id: genId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      const updated = [...messages, userMsg];
      setMessages(updated);
      saveChat(activeUser.id, updated);
      setInputText('');
      setIsTyping(true);

      const delay = 800 + Math.random() * 600;
      setTimeout(() => {
        const answer = askAssistant(activeUser, trimmed);
        const assistantMsg: ChatMessage = {
          id: genId(),
          role: 'assistant',
          content: answer,
          timestamp: Date.now(),
        };
        const final = [...updated, assistantMsg];
        setMessages(final);
        saveChat(activeUser.id, final);
        setIsTyping(false);
      }, delay);
    },
    [messages, isTyping, activeUser],
  );

  function handleSend() {
    sendMessage(inputText);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    const welcome = makeWelcome(activeUser.firstName);
    const fresh = [{ ...welcome, content: `שיחה חדשה! היי ${activeUser.firstName} 👋 במה אוכל לעזור לך?` }];
    setMessages(fresh);
    saveChat(activeUser.id, fresh);
  }

  return (
    <div dir="rtl" className="flex flex-col h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/60 shadow-sm shrink-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            חזרה
          </button>
          <div className="text-center min-w-0">
            <p className="font-bold text-gray-800 text-sm flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 text-violet-500" />
              העוזר החכם
            </p>
            {school && (
              <p className="text-xs text-gray-400 truncate">{school.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              title="נקה שיחה"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs select-none">
              {initials}
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="התנתקות"
              className="text-gray-400 hover:text-rose-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 max-w-3xl mx-auto w-full">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-end">
            <div className="flex items-end gap-2">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                <span
                  className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <AssistantAvatar />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick questions ── */}
      <div className="shrink-0 bg-white/60 backdrop-blur-sm border-t border-gray-100 px-4 sm:px-6 py-2 max-w-3xl mx-auto w-full">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendMessage(q)}
              disabled={isTyping}
              className="shrink-0 text-xs font-semibold bg-violet-50 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-4 sm:px-6 py-3 max-w-3xl mx-auto w-full">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="שאל/י אותי כל שאלה... (Enter לשליחה, Shift+Enter לשורה חדשה)"
            rows={1}
            disabled={isTyping}
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none disabled:opacity-60 leading-relaxed"
            style={{ minHeight: '44px', maxHeight: '120px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="w-11 h-11 rounded-2xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-sm shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          מידע מבוסס על הנתונים בבית הספר שלך בלבד
        </p>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function AssistantAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
      <Sparkles className="w-3.5 h-3.5 text-white" />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      // User message: aligned to the START in RTL = right side visually
      <div className="flex justify-start">
        <div className="max-w-[78%]">
          <div className="bg-violet-600 text-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1 pr-1">{formatTime(message.timestamp)}</p>
        </div>
      </div>
    );
  }

  return (
    // Assistant message: aligned to the END in RTL = left side visually
    <div className="flex justify-end">
      <div className="flex items-end gap-2 max-w-[85%]">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          <p className="text-xs text-gray-400 mt-1.5">{formatTime(message.timestamp)}</p>
        </div>
        <AssistantAvatar />
      </div>
    </div>
  );
}
