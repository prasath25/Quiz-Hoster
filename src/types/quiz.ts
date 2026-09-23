export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  correctAnswerText: string;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface PdfFormatCheck {
  isQuizFormat: boolean;
  confidenceScore: number;
  detectedTitle: string;
  formatCheckSummary: string;
  formatIssues: string[];
  pageCount?: number;
  extractedQuestionCount: number;
}

export interface StudentAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  timeTakenSeconds: number;
}

export interface StudentRecord {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
  status: 'waiting' | 'in-progress' | 'submitted';
  currentQuestionIndex?: number;
  score: number;
  accuracy: number;
  timeTakenSeconds: number;
  submittedAt?: number;
  rank?: number;
  answers?: Record<string, StudentAnswer>;
}

export type TimerMode = 'none' | 'per-question' | 'per-quiz';

export interface RoomSettings {
  timerMode: TimerMode;
  perQuestionSeconds: number; // e.g. 15, 30, 45, 60
  totalQuizMinutes: number;   // e.g. 5, 10, 15
  autoAdvanceOnTimeout: boolean;
  timeLimitSeconds?: number;  // for legacy compatibility
  shuffleQuestions: boolean;
  allowReview: boolean;
  passingScorePercent: number;
}

export interface QuizRoom {
  id: string;
  title: string;
  description?: string;
  hostToken: string;
  createdAt: number;
  status: 'waiting' | 'active' | 'ended';
  startedAt?: number;
  endedAt?: number;
  settings: RoomSettings;
  pdfFormatCheck: PdfFormatCheck;
  questions: QuizQuestion[];
  students: Record<string, StudentRecord>;
}

export interface StudentSubmissionPayload {
  studentId: string;
  answers: {
    questionId: string;
    selectedIndex: number;
    timeTakenSeconds: number;
  }[];
  totalTimeSeconds: number;
}

export interface QuestionReviewItem {
  question: QuizQuestion;
  studentAnswer?: StudentAnswer;
  isCorrect: boolean;
}

export interface SubmissionResult {
  score: number;
  totalPoints: number;
  accuracy: number;
  correctCount: number;
  totalQuestions: number;
  rank: number;
  totalStudents: number;
  timeTakenSeconds: number;
  reviewItems: QuestionReviewItem[];
}
