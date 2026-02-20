import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { quizAttemptModule } from './quiz-attempt.schema';
import { quizModule } from 'src/quiz/quiz.schema';
import { authModule } from 'src/users/users.schema';
import { Model } from 'mongoose';
import { SubmitQuizDto } from './quiz-attempt.dto';

@Injectable()
export class QuizAttemptService {
  constructor(
    @InjectModel(quizAttemptModule.name) private quizAttemptModel: Model<quizAttemptModule>,
    @InjectModel(quizModule.name) private quizModel: Model<quizModule>,
    @InjectModel(authModule.name) private authModel: Model<any>,
  ) {}

  async submit(userId: string, dto: SubmitQuizDto) {
    const user = await this.authModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const quiz = await this.quizModel
      .findById(dto.quizId)
      .populate('questions')
      .exec();
    if (!quiz) throw new NotFoundException('Quiz not found');

    // ensure quiz active
    const now = new Date();
    const start = new Date(String(quiz.startDate));
    const [sh, sm] = (quiz.startTime || '00:00').split(':').map(Number);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(String(quiz.endDate));
    const [eh, em] = (quiz.endTime || '00:00').split(':').map(Number);
    end.setHours(eh, em, 0, 0);
    if (now < start || now > end) {
      throw new BadRequestException('Quiz is not active');
    }

    // prevent duplicate
    const existing = await this.quizAttemptModel.findOne({ user: userId, quizId: dto.quizId });
    if (existing) throw new BadRequestException('You have already submitted this quiz');

    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    let score = 0;

    const marksPerQ = (quiz as any).marksPerQuestion ?? 1;
    const negative = (quiz as any).negativeMarks ?? 0;

    for (const a of dto.answers) {
      const qIndex = a.questionIndex;
      const question = (quiz as any).questions?.[qIndex];
      if (!question) continue;
      if (!a.selectedOption) continue;
      attempted++;
      const selected = a.selectedOption.trim().toLowerCase();
      const correctAnswers: string[] = ((question as any).correctAnswers ||
        []) as string[];
      const isCorrect = correctAnswers.some(
        (ans) => ans && ans.trim().toLowerCase() === selected,
      );
      if (isCorrect) {
        correct++;
        score += marksPerQ;
      } else {
        wrong++;
        score -= negative;
      }
    }

    const totalTimeSpent = new Date(dto.endTime).getTime() - new Date(dto.startTime).getTime();

    const attempt = await this.quizAttemptModel.create({
      user: userId,
      quizId: dto.quizId,
      answers: dto.answers,
      score,
      attemptedQuestions: attempted,
      correctAnswers: correct,
      wrongAnswers: wrong,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      totalTimeSpent,
    } as any);

    // push user into quiz.attemptedUsers
    try {
      (quiz as any).attemptedUsers = (quiz as any).attemptedUsers || [];
      (quiz as any).attemptedUsers.push(user._id);
      await quiz.save();
    } catch {}

    return { message: 'Quiz submitted', data: attempt, success: true };
  }
}

