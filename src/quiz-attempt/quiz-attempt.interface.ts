export interface QuizQuestionStat {
  questionId: string;
  questionIndex: number;
  question: string;
  selectedAnswers: string[];
  correctAnswers: string[];
  isCorrect: boolean;
}

export interface QuizAnalysisResponse {
  message: string;
  quizId: string;
  userId: string;
  score: number;
  timeSpent: number;
  languageSelected: string;
  questions: QuizQuestionStat[];
}
