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
import { AdminTeacherRequestsScreen } from './screens/AdminTeacherRequestsScreen';
import { AdminUsersClassesScreen } from './screens/AdminUsersClassesScreen';
import { AdminAssignmentsScreen } from './screens/AdminAssignmentsScreen';
import { AdminTimetableScreen } from './screens/AdminTimetableScreen';
import { AdminLostFoundScreen } from './screens/AdminLostFoundScreen';
import { TeacherDashboard } from './screens/TeacherDashboard';
import { TeacherNoticeBoardScreen } from './screens/TeacherNoticeBoardScreen';
import { TeacherClassesScreen, TeacherClassDetailScreen } from './screens/TeacherClassesScreen';
import { TeacherAssignmentsScreen } from './screens/TeacherAssignmentsScreen';
import { TeacherClassMessagesScreen } from './screens/TeacherClassMessagesScreen';
import { TeacherExamsScreen } from './screens/TeacherExamsScreen';
import { TeacherAnnouncementRequestsScreen } from './screens/TeacherAnnouncementRequestsScreen';
import { ParentDashboard } from './screens/ParentDashboard';
import { ParentChildTimetableScreen } from './screens/ParentChildTimetableScreen';
import { ParentChildAssignmentsScreen } from './screens/ParentChildAssignmentsScreen';
import { ParentChildExamsScreen } from './screens/ParentChildExamsScreen';
import { ParentClassMessagesScreen } from './screens/ParentClassMessagesScreen';
import { ParentSchoolAnnouncementsScreen } from './screens/ParentSchoolAnnouncementsScreen';
import { ParentPracticeProgressScreen } from './screens/ParentPracticeProgressScreen';
import { ParentNotificationsScreen } from './screens/ParentNotificationsScreen';
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

    case 'admin-teacher-announcement-requests':
      if (activeUser.role !== 'school_admin') {
        return (
          <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />
        );
      }
      return (
        <AdminTeacherRequestsScreen
          activeUser={activeUser}
          onBack={goAdminHome}
          onLogout={handleLogout}
          initialFilter={screen.initialFilter}
        />
      );

    case 'admin-users-classes':
      if (activeUser.role !== 'school_admin') {
        return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      }
      return (
        <AdminUsersClassesScreen
          activeUser={activeUser}
          onBack={goAdminHome}
          onNavigate={navigate}
          onLogout={handleLogout}
          initialTab={screen.initialTab}
        />
      );

    case 'admin-assignments':
      if (activeUser.role !== 'school_admin') return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      return (
        <AdminAssignmentsScreen
          activeUser={activeUser}
          onBack={goAdminHome}
          onNavigate={navigate}
          onLogout={handleLogout}
          initialFilter={screen.initialFilter}
        />
      );

    case 'admin-timetable':
      if (activeUser.role !== 'school_admin') return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      return (
        <AdminTimetableScreen
          activeUser={activeUser}
          onBack={goAdminHome}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );

    case 'admin-lost-found':
      if (activeUser.role !== 'school_admin') return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      return (
        <AdminLostFoundScreen
          activeUser={activeUser}
          onBack={goAdminHome}
          onNavigate={navigate}
          onLogout={handleLogout}
          initialFilter={screen.initialFilter}
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

    case 'teacher-classes':
      if (activeUser.role !== 'teacher') {
        return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      }
      return (
        <TeacherClassesScreen
          activeUser={activeUser}
          onNavigate={navigate}
          onBack={() => setScreen({ id: 'teacher-dashboard' })}
          onLogout={handleLogout}
        />
      );

    case 'teacher-class-detail':
      if (activeUser.role !== 'teacher') {
        return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      }
      return (
        <TeacherClassDetailScreen
          activeUser={activeUser}
          classId={screen.classId}
          onNavigate={navigate}
          onBack={() => setScreen({ id: 'teacher-classes' })}
          onLogout={handleLogout}
        />
      );

    case 'teacher-assignments':
      if (activeUser.role !== 'teacher') {
        return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      }
      return (
        <TeacherAssignmentsScreen
          activeUser={activeUser}
          onBack={() => setScreen({ id: 'teacher-dashboard' })}
          onLogout={handleLogout}
          initialFilter={screen.initialFilter}
        />
      );

    case 'teacher-class-messages':
      if (activeUser.role !== 'teacher') {
        return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      }
      return (
        <TeacherClassMessagesScreen
          activeUser={activeUser}
          onBack={() => setScreen({ id: 'teacher-dashboard' })}
          onLogout={handleLogout}
        />
      );

    case 'teacher-exams':
      if (activeUser.role !== 'teacher') {
        return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      }
      return (
        <TeacherExamsScreen
          activeUser={activeUser}
          onBack={() => setScreen({ id: 'teacher-dashboard' })}
          onLogout={handleLogout}
        />
      );

    case 'teacher-announcement-requests':
      if (activeUser.role !== 'teacher') {
        return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      }
      return (
        <TeacherAnnouncementRequestsScreen
          activeUser={activeUser}
          onBack={() => setScreen({ id: 'teacher-dashboard' })}
          onLogout={handleLogout}
          initialFilter={screen.initialFilter}
        />
      );

    case 'teacher-notice-board':
      if (activeUser.role !== 'teacher') {
        return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      }
      return (
        <TeacherNoticeBoardScreen
          activeUser={activeUser}
          onBack={() => setScreen({ id: 'teacher-dashboard' })}
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

    // ── Parent detail screens ──────────────────────────────────────────────────
    case 'parent-child-timetable':
      if (activeUser.role !== 'parent') return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      return (
        <ParentChildTimetableScreen
          activeUser={activeUser}
          onBack={() => navigate({ id: 'parent-dashboard' })}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );

    case 'parent-child-assignments':
      if (activeUser.role !== 'parent') return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      return (
        <ParentChildAssignmentsScreen
          activeUser={activeUser}
          onBack={() => navigate({ id: 'parent-dashboard' })}
          onNavigate={navigate}
          onLogout={handleLogout}
          initialFilter={screen.initialFilter}
        />
      );

    case 'parent-child-exams':
      if (activeUser.role !== 'parent') return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      return (
        <ParentChildExamsScreen
          activeUser={activeUser}
          onBack={() => navigate({ id: 'parent-dashboard' })}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );

    case 'parent-class-messages':
      if (activeUser.role !== 'parent') return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      return (
        <ParentClassMessagesScreen
          activeUser={activeUser}
          onBack={() => navigate({ id: 'parent-dashboard' })}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );

    case 'parent-school-announcements':
      if (activeUser.role !== 'parent') return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      return (
        <ParentSchoolAnnouncementsScreen
          activeUser={activeUser}
          onBack={() => navigate({ id: 'parent-dashboard' })}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );

    case 'parent-practice-progress':
      if (activeUser.role !== 'parent') return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      return (
        <ParentPracticeProgressScreen
          activeUser={activeUser}
          onBack={() => navigate({ id: 'parent-dashboard' })}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );

    case 'parent-notifications':
      if (activeUser.role !== 'parent') return <Dashboard activeUser={activeUser} onNavigate={navigate} onLogout={handleLogout} />;
      return (
        <ParentNotificationsScreen
          activeUser={activeUser}
          onBack={() => navigate({ id: 'parent-dashboard' })}
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
          studentUserId={activeUser.role === 'student' ? activeUser.id : undefined}
        />
      );

    case 'announcements':
      return <AnnouncementsScreen activeUser={activeUser} onBack={goHome} />;

    case 'placeholder':
      return <PlaceholderScreen title={screen.title} onBack={goHome} />;
  }
}

export default App;
