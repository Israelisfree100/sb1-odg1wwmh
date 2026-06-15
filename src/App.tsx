import React, { useState } from 'react';

import { Dashboard } from './screens/Dashboard';
import { ExamAssistant } from './screens/ExamAssistant';
import { PracticeSession } from './screens/PracticeSession';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import type { AppScreen, PracticeMode } from './types';

function App() {
  const [screen, setScreen] = useState<AppScreen>({ id: 'dashboard' });

  const navigate = (s: AppScreen) => setScreen(s);
  const goHome = () => setScreen({ id: 'dashboard' });
  const goToExamAssistant = () => setScreen({ id: 'exam-assistant' });

  const startPractice = (mode: PracticeMode) =>
    setScreen({ id: 'practice', mode });

  switch (screen.id) {
    case 'dashboard':
      return <Dashboard onNavigate={navigate} />;

    case 'exam-assistant':
      return (
        <ExamAssistant onBack={goHome} onStartPractice={startPractice} />
      );

    case 'practice':
      return (
        <PracticeSession mode={screen.mode} onBack={goToExamAssistant} />
      );

    case 'placeholder':
      return <PlaceholderScreen title={screen.title} onBack={goHome} />;
  }
}

export default App;
