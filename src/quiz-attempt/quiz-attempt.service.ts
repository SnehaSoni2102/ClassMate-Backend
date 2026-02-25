import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { quizAttemptModule } from './quiz-attempt.schema';
import { quizModule } from 'src/quiz/quiz.schema';
import { authModule } from 'src/users/users.schema';
import { notificationModule } from 'src/notification/notification.schema';
import { userSubscriptionModule } from 'src/user-subscription/user-subscription.schema';
import { Model } from 'mongoose';
import { SubmitQuizDto } from './quiz-attempt.dto';

@Injectable()
export class QuizAttemptService {
  constructor(
    @InjectModel(quizAttemptModule.name)
    private quizAttemptModel: Model<quizAttemptModule>,
    @InjectModel(quizModule.name)
    private quizModel: Model<quizModule>,
    @InjectModel(authModule.name)
    private authModel: Model<any>,
    @InjectModel(notificationModule.name)
    private notificationModel: Model<any>,
    @InjectModel(userSubscriptionModule.name)
    private userSubscriptionModel: Model<any>,
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

    // scope/group validations
    if (dto.scope === 'group' && !dto.groupId) {
      throw new BadRequestException('groupId is required for group attempts.');
    }

    if (!user.hasFreeTrial && dto.scope === 'group') {
      const subscription = await this.userSubscriptionModel
        .findOne({
          user: userId,
          group: dto.groupId,
          status: 'active',
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
        })
        .lean();
      if (!subscription) {
        throw new BadRequestException(
          'No active subscription found for this group. Please purchase one.',
        );
      }
    }

    // prevent duplicate
    const existingQuery: any = { user: userId, quizId: dto.quizId };
    if (dto.scope === 'group') existingQuery.groupId = dto.groupId;
    const existing = await this.quizAttemptModel.findOne(existingQuery);
    if (existing)
      throw new BadRequestException('You have already submitted this quiz');

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
      if (
        !a.selectedOption ||
        (Array.isArray(a.selectedOption) && a.selectedOption.length === 0)
      )
        continue;
      attempted++;
      const selectedArray = Array.isArray(a.selectedOption)
        ? a.selectedOption.map((s) => String(s).trim().toLowerCase())
        : [String(a.selectedOption).trim().toLowerCase()];
      const correctAnswers = ((question as any).correctAnswers || []).map(
        (c: any) => String(c).trim().toLowerCase(),
      );
      // treat as correct when selected set matches correctAnswers set (order-insensitive)
      const selectedSet = new Set(selectedArray);
      const correctSet = new Set(correctAnswers);
      const isCorrect =
        selectedSet.size === correctSet.size &&
        [...selectedSet].every((s) => correctSet.has(s));
      if (isCorrect) {
        correct++;
        score += marksPerQ;
      } else {
        wrong++;
        score -= negative;
      }
    }

    const totalTimeSpent =
      new Date(dto.endTime).getTime() - new Date(dto.startTime).getTime();

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
      scope: dto.scope,
      groupId: dto.scope === 'group' ? dto.groupId : null,
      languageSelected: dto.language,
    } as any);

    // push user into quiz.attemptedUsers
    try {
      (quiz as any).attemptedUsers = (quiz as any).attemptedUsers || [];
      (quiz as any).attemptedUsers.push(user._id);
      await quiz.save();
    } catch {
      /* ignore errors when updating quiz attempted users */
    }

    // push quiz id to user.submittedTests
    try {
      user.submittedTests = user.submittedTests || [];
      user.submittedTests.push(quiz._id);
      await user.save();
    } catch {
      /* ignore errors when updating user submitted tests */
    }

    // notification
    try {
      await this.notificationModel.create({
        userId: user._id,
        message: `🎯 "${(quiz as any).title}" quiz submitted successfully.`,
        type: 'quiz submission',
      });
    } catch {
      /* ignore notification creation errors */
    }

    return { message: 'Quiz submitted', data: attempt, success: true };
  }
}
