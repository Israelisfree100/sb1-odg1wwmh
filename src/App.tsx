import React, { useState } from 'react';

import { Dashboard } from './screens/Dashboard';
import { ExamAssistant } from './screens/ExamAssistant';
import { PracticeSession } from './screens/PracticeSession';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { RoleSelectionScreen } from './screens/RoleSelectionScreen';
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
import { TeacherDashboard } from './screens/TeacherDashboard';
import { ParentDashboard } from './screens/ParentDashboard';
import { loadSessionUser, clearSession } from './utils/auth';
import { getDashboardForRole, getAllowedScreenIds } from './utils/roleHelpers';
import type { AppScreen, PracticeMode, User, UserRole } from './types';

// ── Pre-login phase ──────────────────────────────────────────────────────────

type PreLoginPhase =
  | { id: 'role-selection' }
  | { id: 'login'; selectedRole: UserRole };

// ── Helpers ──────────────────────────────────────────────────────────────────

function initialScreen(user: User | null): AppScreen {
  if (!user) return { id: 'dashboard' };
  return getDashboardForRole(user.role);
}

function App() {
  const [activeUser, setActiveUser] = useState<User | null>(() =>
    loadSessionUser(),
  );
  const [screen, setScreen] = useState<AppScreen>(() =>
    initialScreen(loadSessionUser()),
  );
  const [preLogin, setPreLogin] = useState<PreLoginPhase>({ id: 'role-selection' });

  // ── Login & logout handlers ─────────────────────────────────────────────────
  const handleRoleSelect = (role: UserRole) => {
    setPreLogin({ id: 'login', selectedRole: role });
  };

  const handleLogin = (user: User) => {
    setActiveUser(user);
    setScreen(initialScreen(user));
  };

  const handleLogout = () => {
    clearSession();
    setActiveUser(null);
    setPreLogin({ id: 'role-selection' });
    setScreen({ id: 'dashboard' });
  };

  // ── Not logged in — show role selection or login ────────────────────────────
  if (!activeUser) {
    if (preLogin.id === 'role-selection') {
      return <RoleSelectionScreen onSelectRole={handleRoleSelect} />;
    }
    return (
      <LoginScreen
        selectedRole={preLogin.selectedRole}
        onLogin={handleLogin}
        onBack={() => setPreLogin({ id: 'role-selection' })}
      />
    );
  }

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const navigate = (s: AppScreen) => setScreen(s);

  const goHome = () => setScreen(initialScreen(activeUser));

  const goAdminHome = () => setScreen({ id: 'admin-dashboard' });

  const startPractice = (mode: PracticeMode, subject: string) =>
    setScreen({ id: 'practice', mode, subject });

  const goToExamAssistant = () => setScreen({ id: 'exam-assistant' });

  // ── Route guard: redirect to role-appropriate home if on wrong screen ───────
  const allowedIds = getAllowedScreenIds(activeUser.role);
  if (!allowedIds.includes(screen.id)) {
    // Silently redirect to the user's own home dashboard
    const home = getDashboardForRole(activeUser.role);
    if (screen.id !== home.id) {
      setScreen(home);
    }
  }

  // ── Screen router ───────────────────────────────────────────────────────────
  switch (screen.id) {
    // ── Admin screens ──────────────────────────────────────────────────────────
    case 'admin-dashboard':
      if (activeUser.role !== 'school_admin') {
        return (
          <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />
        );
      }
      return (
        <AdminDashboard
          activeUser={activeUser}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );

    case 'admin-announcements':
      if (activeUser.role !== 'school_admin') {
        return (
          <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />
        );
      }
      return (
        <AdminAnnouncementsScreen
          activeUser={activeUser}
          onBack={goAdminHome}
          onLogout={handleLogout}
        />
      );

    case 'admin-exams':
      if (activeUser.role !== 'school_admin') {
        return (
          <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />
        );
      }
      return (
        <AdminExamsScreen
          activeUser={activeUser}
          onBack={goAdminHome}
          onLogout={handleLogout}
        />
      );

    // ── Teacher screens ────────────────────────────────────────────────────────
    case 'teacher-dashboard':
      if (activeUser.role !== 'teacher') {
        return (
          <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />
        );
      }
      return (
        <TeacherDashboard
          activeUser={activeUser}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );

    // ── Parent screens ─────────────────────────────────────────────────────────
    case 'parent-dashboard':
      if (activeUser.role !== 'parent') {
        return (
          <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />
        );
      }
      return (
        <ParentDashboard
          activeUser={activeUser}
          onNavigate={navigate}
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
      return <AnnouncementsScreen activeUser={activeUser} onBack={goHome} />;

    case 'placeholder':
      return <PlaceholderScreen title={screen.title} onBack={goHome} />;
  }
}

export default App;
