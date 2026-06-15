export type AppScreen =
  | { id: 'dashboard' }
  | { id: 'exam-assistant' }
  | { id: 'practice'; mode: PracticeMode }
  | { id: 'placeholder'; title: string };

export type PracticeMode = 'quick' | 'full' | 'by-topic';

export type TopicKey = 'multiplication' | 'division' | 'word-problem';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
  topic: TopicKey;
}
