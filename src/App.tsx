import React, { useState } from 'react';

import { Dashboard } from './screens/Dashboard';
import { ExamAssistant } from './screens/ExamAssistant';
import { PracticeSession } from './screens/PracticeSession';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { LoginScreen } from './screens/LoginScreen';
import { AnnouncementsScreen } from './screens/AnnouncementsScreen';
import { DailyScheduleScreen } from './screens/DailyScheduleScreen';
import { AssignmentsScreen } from './screens/AssignmentsScreen';
import { ClassMessagesScreen } from './screens/ClassMessagesScreen';
import { LostFoundScreen } from './screens/LostFoundScreen';
import { SmartAssistantScreen } from './screens/SmartAssistantScreen';
import { AdminDashboard } from './screens/AdminDashboard';
import { AdminAnnouncementsScreen } from './screens/AdminAnnouncementsScreen';
import { AdminExamsScreen } from './screens/AdminExamsScreen';
import { loadSessionUser, clearSession } from './utils/auth';
import type { AppScreen, PracticeMode, User } from './types';

function initialScreen(user: User | null): AppScreen {
  if (user?.role === 'school_admin') return { id: 'admin-dashboard' };
  return { id: 'dashboard' };
}

function App() {
  const [activeUser, setActiveUser] = useState<User | null>(() =>
    loadSessionUser(),
  );
  const [screen, setScreen] = useState<AppScreen>(() =>
    initialScreen(loadSessionUser()),
  );

  const handleLogin = (user: User) => {
    setActiveUser(user);
    setScreen(initialScreen(user));
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
  const goHome = () => {
    setScreen(
      activeUser.role === 'school_admin'
        ? { id: 'admin-dashboard' }
        : { id: 'dashboard' },
    );
  };
  const goToExamAssistant = () => setScreen({ id: 'exam-assistant' });
  const goAdminHome = () => setScreen({ id: 'admin-dashboard' });

  const startPractice = (mode: PracticeMode, subject: string) =>
    setScreen({ id: 'practice', mode, subject });

  // ── Guard: admins should stay on admin screens; students on student screens ──
  const isAdmin = activeUser.role === 'school_admin';
  const adminScreenIds: AppScreen['id'][] = [
    'admin-dashboard',
    'admin-announcements',
    'admin-exams',
  ];
  const onAdminScreen = adminScreenIds.includes(screen.id);

  if (isAdmin && !onAdminScreen) {
    // Admin accidentally ended up on a student screen — redirect to admin home
    return (
      <AdminDashboard
        activeUser={activeUser}
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    );
  }

  if (!isAdmin && onAdminScreen) {
    // Student accidentally ended up on an admin screen — redirect to student home
    return (
      <Dashboard
        activeUser={activeUser}
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    );
  }

  // ── Screen router ───────────────────────────────────────────────────────────
  switch (screen.id) {
    // ── Admin screens ──────────────────────────────────────────────────────────
    case 'admin-dashboard':
      return (
        <AdminDashboard
          activeUser={activeUser}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );

    case 'admin-announcements':
      return (
        <AdminAnnouncementsScreen
          activeUser={activeUser}
          onBack={goAdminHome}
          onLogout={handleLogout}
        />
      );

    case 'admin-exams':
      return (
        <AdminExamsScreen
          activeUser={activeUser}
          onBack={goAdminHome}
          onLogout={handleLogout}
        />
      );

    // ── Student screens ────────────────────────────────────────────────────────
    case 'dashboard':
      return (
        <Dashboard
          activeUser={activeUser}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );

    case 'daily-schedule':
      return (
        <DailyScheduleScreen
          activeUser={activeUser}
          onBack={goHome}
          onLogout={handleLogout}
        />
      );

    case 'assignments':
      return (
        <AssignmentsScreen
          activeUser={activeUser}
          onBack={goHome}
          onLogout={handleLogout}
        />
      );

    case 'class-messages':
      return (
        <ClassMessagesScreen
          activeUser={activeUser}
          onBack={goHome}
          onLogout={handleLogout}
        />
      );

    case 'lost-found':
      return (
        <LostFoundScreen
          activeUser={activeUser}
          onBack={goHome}
          onLogout={handleLogout}
        />
      );

    case 'smart-assistant':
      return (
        <SmartAssistantScreen
          activeUser={activeUser}
          onBack={goHome}
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
