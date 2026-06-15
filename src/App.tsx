import React, { useState } from 'react';

import { Dashboard } from './screens/Dashboard';
import { ExamAssistant } from './screens/ExamAssistant';
import { PracticeSession } from './screens/PracticeSession';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { LoginScreen } from './screens/LoginScreen';
import { AnnouncementsScreen } from './screens/AnnouncementsScreen';
import { loadSessionUser, clearSession } from './utils/auth';
import type { AppScreen, PracticeMode, User } from './types';

function App() {
  const [activeUser, setActiveUser] = useState<User | null>(() =>
    loadSessionUser(),
  );
  const [screen, setScreen] = useState<AppScreen>({ id: 'dashboard' });

  const handleLogin = (user: User) => {
    setActiveUser(user);
    setScreen({ id: 'dashboard' });
  };

  const handleLogout = () => {
    clearSession();
    setActiveUser(null);
    setScreen({ id: 'dashboard' });
  };

  // ── Not logged in → show login screen ──────────────────────────────────────
  if (!activeUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const navigate = (s: AppScreen) => setScreen(s);
  const goHome = () => setScreen({ id: 'dashboard' });
  const goToExamAssistant = () => setScreen({ id: 'exam-assistant' });

  const startPractice = (mode: PracticeMode, subject: string) =>
    setScreen({ id: 'practice', mode, subject });

  // ── Screen router ───────────────────────────────────────────────────────────
  switch (screen.id) {
    case 'dashboard':
      return (
        <Dashboard
          activeUser={activeUser}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );

    case 'exam-assistant':
      return (
        <ExamAssistant
          activeUser={activeUser}
          onBack={goHome}
          onStartPractice={startPractice}
          onLogout={handleLogout}
        />
      );

    case 'practice':
      return (
        <PracticeSession
          mode={screen.mode}
          subject={screen.subject}
          onBack={goToExamAssistant}
        />
      );

    case 'announcements':
      return (
        <AnnouncementsScreen activeUser={activeUser} onBack={goHome} />
      );

    case 'placeholder':
      return <PlaceholderScreen title={screen.title} onBack={goHome} />;
  }
}

export default App;
