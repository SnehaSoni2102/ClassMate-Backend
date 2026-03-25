import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, filter, map } from 'rxjs';

export interface QuestionRanker {
  userId: string;
  marks: number;
  timeTaken: number;
}

export interface QuizAnswerSavedEvent {
  eventType: 'quiz-answer-saved';
  quizId: string;
  questionId: string;
  userId: string;
  score: number;
  totalTimeSpent: number;
  top5: QuestionRanker[];
  timestamp: string;
}

export interface QuizQuestionAllRespondedEvent {
  eventType: 'quiz-question-all-responded';
  quizId: string;
  questionId: string;
  userId: string; // last responder
  scope: 'global' | 'group';
  groupId?: string;
  expectedCount: number;
  respondedCount: number;
  top5: QuestionRanker[];
  timestamp: string;
}

export interface QuizNextQuestionEvent {
  eventType: 'quiz-next-question';
  quizId: string;
  nextQuestionIndex: number;
  nextQuestionId?: string;
  timestamp: string;
}

export type QuizAttemptEvent =
  | QuizAnswerSavedEvent
  | QuizQuestionAllRespondedEvent
  | QuizNextQuestionEvent;

@Injectable()
export class QuizAttemptEventsService {
  private readonly events$ = new Subject<QuizAttemptEvent>();

  emitAnswerSaved(event: QuizAnswerSavedEvent): void {
    this.events$.next(event);
  }

  emitQuestionAllResponded(event: QuizQuestionAllRespondedEvent): void {
    this.events$.next(event);
  }

  emitNextQuestion(event: QuizNextQuestionEvent): void {
    this.events$.next(event);
  }

  streamForQuiz(quizId: string): Observable<MessageEvent> {
    return this.events$.pipe(
      filter((event) => event.quizId === quizId),
      map(
        (event) =>
          ({
            type: event.eventType,
            data: event,
          }) as MessageEvent,
      ),
    );
  }
}
