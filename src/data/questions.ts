import type { Question, TopicKey } from '../types';

export const ALL_QUESTIONS: Question[] = [
  // ── כפל (multiplication) ──────────────────────────────────────────────
  {
    id: 'mul-1',
    text: '6 × 7 = ?',
    options: ['40', '42', '48', '36'],
    correctIndex: 1,
    explanation: '6×7=42. אפשר לחשב: 6×5=30 ואז להוסיף עוד 6×2=12, ביחד 30+12=42',
    hint: 'נסי לחשב 6×5 קודם ואז להוסיף עוד 6×2',
    topic: 'multiplication',
  },
  {
    id: 'mul-2',
    text: '8 × 4 = ?',
    options: ['28', '36', '32', '30'],
    correctIndex: 2,
    explanation: '8×4=32. דרך קלה: 8×2=16, ואז 16×2=32',
    hint: 'נסי לפצל: 8×4 = 8×2 + 8×2. כמה זה 8×2?',
    topic: 'multiplication',
  },
  {
    id: 'mul-3',
    text: '9 × 3 = ?',
    options: ['24', '27', '30', '21'],
    correctIndex: 1,
    explanation: '9×3=27. בלוח כפל 9: 9, 18, 27 — ספרי שלוש פעמים',
    hint: 'לוח כפל 9: 9, 18... מה המספר הבא?',
    topic: 'multiplication',
  },
  {
    id: 'mul-4',
    text: '7 × 8 = ?',
    options: ['54', '56', '48', '52'],
    correctIndex: 1,
    explanation: '7×8=56. טריק זיכרון: 5,6,7,8 — חמש-שש-שבע-שמונה = 56!',
    hint: 'נסי: 7×8 = 7×4 + 7×4. כמה זה 7×4?',
    topic: 'multiplication',
  },
  {
    id: 'mul-5',
    text: '5 × 9 = ?',
    options: ['40', '50', '45', '54'],
    correctIndex: 2,
    explanation: '5×9=45. כפל ב-5 תמיד מסתיים ב-0 או ב-5. 9×5=45',
    hint: 'כפל ב-5 תמיד מסתיים ב-0 או ב-5. בין 40 ל-50 יש רק מספר אחד כזה',
    topic: 'multiplication',
  },

  // ── חילוק (division) ──────────────────────────────────────────────────
  {
    id: 'div-1',
    text: '24 ÷ 4 = ?',
    options: ['5', '7', '6', '8'],
    correctIndex: 2,
    explanation: '24÷4=6, כי 4×6=24. תמיד אפשר לבדוק בכפל!',
    hint: 'נסי: 4×5=20, 4×6=? האם מגיעים ל-24?',
    topic: 'division',
  },
  {
    id: 'div-2',
    text: '35 ÷ 7 = ?',
    options: ['4', '6', '5', '3'],
    correctIndex: 2,
    explanation: '35÷7=5, כי 7×5=35. בדיקה: 7×5=35 ✓',
    hint: 'נסי: 7×4=28, 7×5=? האם אחד מהם הוא 35?',
    topic: 'division',
  },
  {
    id: 'div-3',
    text: '36 ÷ 6 = ?',
    options: ['5', '7', '9', '6'],
    correctIndex: 3,
    explanation: '36÷6=6, כי 6×6=36. זה מספר ריבועי — 6 כפול 6!',
    hint: 'חפשי מספר שכשמכפילים אותו ב-6 מקבלים בדיוק 36',
    topic: 'division',
  },
  {
    id: 'div-4',
    text: '48 ÷ 8 = ?',
    options: ['5', '7', '6', '4'],
    correctIndex: 2,
    explanation: '48÷8=6, כי 8×6=48. בדיקה: 8×6=48 ✓',
    hint: 'נסי: 8×5=40, 8×6=? האם אחד מהם הוא 48?',
    topic: 'division',
  },
  {
    id: 'div-5',
    text: '30 ÷ 5 = ?',
    options: ['5', '7', '4', '6'],
    correctIndex: 3,
    explanation: '30÷5=6, כי 5×6=30. ספרי ב-5: 5,10,15,20,25,30 — שש פעמים!',
    hint: 'ספרי ב-5 עד ש תגיעי ל-30: 5,10,15... כמה פעמים?',
    topic: 'division',
  },

  // ── בעיות מילוליות (word problems) ───────────────────────────────────
  {
    id: 'word-1',
    text: 'לדנה יש 4 קופסאות.\nבכל קופסה יש 6 עפרונות.\nכמה עפרונות יש לדנה בסך הכל?',
    options: ['18', '24', '28', '20'],
    correctIndex: 1,
    explanation: '4 קופסאות × 6 עפרונות = 24 עפרונות בסך הכל',
    hint: 'כשיש קבוצות שוות, מכפילים: מספר קופסאות × עפרונות בכל קופסה',
    topic: 'word-problem',
  },
  {
    id: 'word-2',
    text: 'בכיתה ישנם 32 תלמידים.\nהמורה חילקה אותם לקבוצות שוות של 8.\nכמה קבוצות יש?',
    options: ['3', '5', '4', '6'],
    correctIndex: 2,
    explanation: '32÷8=4 קבוצות. בדיקה: 8×4=32 ✓',
    hint: 'כמה פעמים 8 נכנס ב-32? נסי: 8×3=24, 8×4=?',
    topic: 'word-problem',
  },
  {
    id: 'word-3',
    text: 'בחנות יש 9 מדפים.\nבכל מדף יש 7 ספרים.\nכמה ספרים יש בחנות בסך הכל?',
    options: ['56', '60', '63', '54'],
    correctIndex: 2,
    explanation: '9×7=63 ספרים. לוח כפל 9: ...54, 63 — המספר השביעי הוא 63',
    hint: 'מדפים × ספרים בכל מדף = 9×7. לוח כפל 9: 9,18,27,36,45,54,?',
    topic: 'word-problem',
  },
  {
    id: 'word-4',
    text: 'לאמא יש 40 עוגיות.\nהיא מחלקת אותן שווה בין 8 ילדים.\nכמה עוגיות מקבל כל ילד?',
    options: ['4', '6', '5', '8'],
    correctIndex: 2,
    explanation: '40÷8=5 עוגיות לכל ילד. בדיקה: 8×5=40 ✓',
    hint: 'כמה פעמים 8 נכנס ב-40? נסי: 8×4=32, 8×5=?',
    topic: 'word-problem',
  },
  {
    id: 'word-5',
    text: 'לכיתה יש 45 עפרונות.\nהמורה מחלקת אותם שווה ל-9 תלמידים.\nכמה עפרונות מקבל כל תלמיד?',
    options: ['4', '6', '5', '7'],
    correctIndex: 2,
    explanation: '45÷9=5 עפרונות לכל תלמיד. בדיקה: 9×5=45 ✓',
    hint: 'נסי: 9×4=36, 9×5=? האם אחד מהם הוא 45?',
    topic: 'word-problem',
  },
];

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getQuestionsForMode(mode: 'quick' | 'full'): Question[] {
  return shuffleArray(ALL_QUESTIONS).slice(0, mode === 'quick' ? 5 : 10);
}

export function getQuestionsForTopic(topic: TopicKey): Question[] {
  const filtered = ALL_QUESTIONS.filter((q) => q.topic === topic);
  return shuffleArray(filtered).slice(0, 5);
}
