export interface QuestionStat {
  questionId: string;
  question: string;
  selectedAnswers: string[];
  correctAnswers: string[];
  isCorrect: boolean;
  index: number;
}

export interface TopicAnalysis {
  topicId: string;
  topicName: string;
  questions: QuestionStat[];
  questionIndices: number[];
}

export interface SectionAnalysis {
  sectionId: string;
  sectionName: string;
  totalQuestions: number;
  answered: number;
  correct: number;
  wrong: number;
  skipped: number;
  questions: QuestionStat[];
  topics: TopicAnalysis[];
  correctPercentage: number;
}
