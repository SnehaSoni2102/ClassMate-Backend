import {
  Injectable,
  NotFoundException,
  BadRequestException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { quizAttemptModule } from './quiz-attempt.schema';
import { quizModule } from 'src/quiz/quiz.schema';
import { authModule } from 'src/users/users.schema';
import { notificationModule } from 'src/notification/notification.schema';
import { userSubscriptionModule } from 'src/user-subscription/user-subscription.schema';
import { questionModule } from 'src/question/question.schema';
import { Model } from 'mongoose';
import { SubmitQuizDto } from './quiz-attempt.dto';
import {
  QuizAnalysisResponse,
  QuizQuestionStat,
} from './quiz-attempt.interface';
import { arraysEqual } from 'utils/helper';
import {
  generateCertificate,
  CertificateData,
} from 'utils/generateCertificate';
import path from 'path';

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
    @InjectModel(questionModule.name)
    private questionModel: Model<questionModule>,
  ) {}

  async submit(userId: string, dto: SubmitQuizDto) {
    const user = await this.authModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const quiz = await this.quizModel.findById(dto.quizId).exec();
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

    const questionEntries = (quiz as any).questions || [];
    const questionIds: any[] = questionEntries.map((e: any) =>
      e?.questionId ? e.questionId : null,
    );
    const uniqueQuestionIds = Array.from(new Set(questionIds.filter(Boolean)));
    const questionsDocs = uniqueQuestionIds.length
      ? await this.questionModel
          .find({ _id: { $in: uniqueQuestionIds } })
          .lean()
      : [];
    const questionMap = new Map(
      questionsDocs.map((q: any) => [String(q._id), q]),
    );

    for (const a of dto.answers) {
      const qIndex = a.questionIndex;
      const entry = questionEntries?.[qIndex];
      const question = entry ? questionMap.get(String(entry.questionId)) : null;
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
      const language = dto.language === 'hi' ? 'hi' : 'en';
      const correctRaw =
        language === 'hi'
          ? (question as any).correctAnswers_hi
          : (question as any).correctAnswers;
      const correctAnswers = (correctRaw || []).map((c: any) =>
        String(c).trim().toLowerCase(),
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

  async fetchAllQuizAttempts() {
    const attempts = await this.quizAttemptModel.find().populate('user').exec();
    return {
      message: 'All submitted quizzes fetched',
      data: attempts,
    };
  }

  async getQuizAnalysisById(
    quizId: string,
    userId: string,
  ): Promise<QuizAnalysisResponse> {
    const attempt = await this.quizAttemptModel
      .findOne({ quizId, user: userId })
      .lean();
    if (!attempt) throw new NotFoundException('Quiz attempt not found');

    const quiz = await this.quizModel.findById(quizId).lean();
    if (!quiz) throw new NotFoundException('Quiz not found');

    const answerMap = new Map<number, string[]>();
    for (const ans of attempt.answers || []) {
      const selected = (ans.selectedOption || []).map((s) =>
        String(s).toLowerCase().trim(),
      );
      answerMap.set(ans.questionIndex, selected);
    }

    const language = attempt.languageSelected === 'hi' ? 'hi' : 'en';
    const questionEntries = (quiz as any).questions || [];
    const questionIds = questionEntries
      .map((e: any) => e?.questionId)
      .filter(Boolean);

    const questionsDocs = questionIds.length
      ? await this.questionModel
          .find({ _id: { $in: questionIds } })
          .lean()
      : [];
    const questionMap = new Map(
      questionsDocs.map((q: any) => [String(q._id), q]),
    );
    const questionStats: QuizQuestionStat[] = [];

    for (let i = 0; i < questionEntries.length; i++) {
      const entry = questionEntries[i];
      const q = entry ? questionMap.get(String(entry.questionId)) : null;
      if (!q) continue;
      const questionId = String(entry?.questionId);
      const selectedAnswers = answerMap.get(i) || [];
      const correctAnswers = (
        language === 'hi' ? q.correctAnswers_hi : q.correctAnswers
      ).map((a: string) => String(a).toLowerCase().trim());

      const isCorrect =
        selectedAnswers.length === correctAnswers.length &&
        selectedAnswers.every((a, idx) => a === correctAnswers[idx]);

      questionStats.push({
        questionId,
        questionIndex: i,
        question: language === 'hi' ? q.text_hi : q.text,
        selectedAnswers,
        correctAnswers,
        isCorrect,
      });
    }

    return {
      message: 'Analysis fetched successfully',
      quizId,
      userId,
      score: attempt.score ?? 0,
      timeSpent: attempt.totalTimeSpent ?? 0,
      languageSelected: attempt.languageSelected ?? 'en',
      questions: questionStats,
    };
  }

  async getQuestionsByFilter(
    userId: string,
    quizId: string,
    filter: 'all' | 'correct' | 'incorrect' | 'not_answered',
  ) {
    const attempt = await this.quizAttemptModel
      .findOne({ user: userId, quizId })
      .lean();
    const quiz = await this.quizModel.findById(quizId).lean();

    if (!quiz) throw new NotFoundException('Quiz not found');

    const answerMap = new Map<number, { selectedOption: string[] }>();
    if (attempt?.answers) {
      for (const ans of attempt.answers) {
        answerMap.set(ans.questionIndex, {
          selectedOption: ans.selectedOption || [],
        });
      }
    }

    const questionEntries = (quiz as any).questions || [];
    const questionIds = questionEntries
      .map((e: any) => e?.questionId)
      .filter(Boolean);

    const questionsDocs = questionIds.length
      ? await this.questionModel
          .find({ _id: { $in: questionIds } })
          .lean()
      : [];

    const questionMap = new Map(
      questionsDocs.map((q: any) => [String(q._id), q]),
    );

    const withIndex = questionEntries.map((entry: any, index: number) => ({
      index,
      q: entry ? questionMap.get(String(entry.questionId)) : null,
    }));
    const filtered = withIndex.filter(({ q, index }) => {
      if (!q) return false;
      const userAns = answerMap.get(index);
      const correctAnswers = q.correctAnswers || [];
      const selected = userAns?.selectedOption || [];

      if (filter === 'all') return true;
      if (filter === 'correct')
        return selected.length > 0 && arraysEqual(selected, correctAnswers);
      if (filter === 'incorrect')
        return selected.length > 0 && !arraysEqual(selected, correctAnswers);
      if (filter === 'not_answered')
        return !userAns || selected.length === 0;
      return true;
    });

    const questionsWithDetails = filtered.map(
      ({ q, index: globalIndex }: any, i: number) => {
        const userAns = answerMap.get(globalIndex);
        const selected = userAns?.selectedOption || [];
        const correctAnswers = q.correctAnswers || [];
        const isCorrect = arraysEqual(selected, correctAnswers);

        let marks = 0;
        if (isCorrect) marks = q.marks ?? 1;
        else if (selected.length > 0) marks = -(q.negativeMarks ?? 0);

        return {
          questionId: q._id.toString(),
          questionIndex: globalIndex,
          questionNumber: i + 1,
          title: q.text,
          title_hi: q.text_hi,
          image: q.image,
          marks,
          timeTaken: 0,
          correctAnswers,
          selectedAnswers: selected,
        };
      },
    );

    return {
      message: 'Questions fetched successfully',
      data: {
        totalQuestions: `${questionsWithDetails.length}/${questionEntries.length}`,
        questions: questionsWithDetails,
      },
      success: true,
    };
  }

  async getQuestionDetailsByIndex(
    userId: string,
    quizId: string,
    questionIndex: number,
  ) {
    const attempt = await this.quizAttemptModel
      .findOne({ user: userId, quizId })
      .lean();
    if (!attempt) throw new NotFoundException('Quiz attempt not found');

    const quiz = await this.quizModel.findById(quizId).lean();
    if (!quiz) throw new NotFoundException('Quiz not found');

    const questionEntries = (quiz as any).questions || [];
    const entry = questionEntries[questionIndex];
    if (!entry) throw new NotFoundException('Question not found at this index');

    const questionId = entry?.questionId;
    const question = questionId
      ? await this.questionModel.findById(questionId).lean()
      : null;
    if (!question)
      throw new NotFoundException('Question not found at this index');

    const answer = attempt.answers?.find(
      (a) => a.questionIndex === Number(questionIndex),
    );
    const userSelected = answer?.selectedOption || [];

    return {
      message: 'Question fetched successfully',
      data: {
        questionNumber: Number(questionIndex) + 1,
        questionText: question.text,
        questionText_hi: question.text_hi,
        correctAnswers: question.correctAnswers || [],
        userSelectedAnswers: userSelected,
        solution: question.solution || null,
      },
      success: true,
    };
  }

  async getRelatedQuizzesByQuizId(quizId: string, userId: string) {
    const quiz = await this.quizModel.findById(quizId).lean();
    if (!quiz) throw new NotAcceptableException('Quiz not found');

    const userAttempts = await this.quizAttemptModel
      .find({ user: userId })
      .select('quizId')
      .lean();
    const attemptedQuizIds = new Set(
      userAttempts.map((a) => a.quizId.toString()),
    );

    const relatedQuizzes = await this.quizModel
      .find({
        _id: { $nin: [quizId, ...Array.from(attemptedQuizIds)] },
        exam: (quiz as any).exam,
        status: 'published',
      })
      .select('title title_hi _id')
      .lean();

    return {
      message: 'Related quizzes fetched successfully',
      data: {
        originalQuizTitle: (quiz as any).title,
        relatedQuizzes: relatedQuizzes.map((q: any) => ({
          _id: q._id,
          title: q.title,
          title_hi: q.title_hi,
        })),
      },
      success: true,
    };
  }

  async getQuizSummary(quizId: string, userId: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    const userAttempt = await this.quizAttemptModel.findOne({
      quizId,
      user: userId,
    });
    if (!userAttempt) throw new NotFoundException('User attempt not found');

    const allAttempts = await this.quizAttemptModel
      .find({ quizId })
      .sort({ score: -1 });

    const rank =
      allAttempts.findIndex((a) => a.user.toString() === userId.toString()) +
      1;
    const percentile =
      allAttempts.length > 0
        ? ((allAttempts.length - rank) / allAttempts.length) * 100
        : 0;

    const accuracy =
      (userAttempt.attemptedQuestions ?? 0) > 0
        ? (userAttempt.correctAnswers ?? 0) / (userAttempt.attemptedQuestions ?? 1)
        : 0;

    return {
      message: 'Quiz attempt summary fetched successfully',
      data: {
        rank,
        percentile: +percentile.toFixed(2),
        score: userAttempt.score ?? 0,
        attemptedQuestions: userAttempt.attemptedQuestions ?? 0,
        correctAnswers: userAttempt.correctAnswers ?? 0,
        wrongAnswers: userAttempt.wrongAnswers ?? 0,
        timeSpent: userAttempt.totalTimeSpent ?? 0,
        accuracy: +(accuracy * 100).toFixed(2),
      },
    };
  }

  async getQuizRanking(quizId: string, userId: string) {
    const allAttempts = await this.quizAttemptModel
      .find({ quizId })
      .populate('user')
      .sort({ score: -1 });

    if (!allAttempts || allAttempts.length === 0)
      throw new NotFoundException('No attempts found for this quiz');

    const bestAttemptsMap = new Map<string, any>();
    for (const attempt of allAttempts) {
      const uid = (attempt.user as any)?._id?.toString?.() ?? attempt.user.toString();
      if (
        !bestAttemptsMap.has(uid) ||
        (attempt.score ?? 0) > (bestAttemptsMap.get(uid).score ?? 0)
      ) {
        bestAttemptsMap.set(uid, attempt);
      }
    }

    const uniqueAttempts = Array.from(bestAttemptsMap.values());
    const fullRanking = uniqueAttempts
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((attempt, index) => {
        const user = attempt.user as any;
        return {
          rank: index + 1,
          name: user?.Name || 'User',
          score: attempt.score ?? 0,
          userId: user?._id ?? attempt.user,
          groupId: attempt.groupId || null,
        };
      });

    const podium = fullRanking.slice(0, 3).map((entry) => {
      const attempt = allAttempts.find(
        (a) =>
          ((a.user as any)?._id ?? a.user).toString() ===
          (entry.userId ?? '').toString(),
      );
      const user = attempt?.user as any;
      return {
        rank: entry.rank,
        name: user?.Name || 'User',
        profilePicture: user?.profilePicture || '',
        score: entry.score,
        userId: entry.userId,
        groupId: entry.groupId,
      };
    });

    const currentUserRankObj = fullRanking.find(
      (entry) => (entry.userId ?? '').toString() === userId,
    );

    let groupRank: number | null = null;
    if (currentUserRankObj?.groupId) {
      const groupRanking = fullRanking
        .filter(
          (e) =>
            (e.groupId ?? '').toString() ===
            (currentUserRankObj.groupId ?? '').toString(),
        )
        .map((e, index) => ({ ...e, rank: index + 1 }));
      const currentInGroup = groupRanking.find(
        (e) => (e.userId ?? '').toString() === userId,
      );
      groupRank = currentInGroup?.rank ?? null;
    }

    return {
      message: 'Ranking fetched successfully',
      data: {
        podium,
        fullRanking,
        currentUser: currentUserRankObj || null,
        groupRank,
      },
    };
  }

  async getAllIndiaQuizRanking(quizId: string, userId: string) {
    const quiz = await this.quizModel.findOne({
      _id: quizId,
      isAllIndia: true,
    });
    if (!quiz)
      throw new NotFoundException('Quiz not found or not an All India quiz');

    const attempts = await this.quizAttemptModel
      .find({ quizId })
      .populate('user')
      .sort({ score: -1, totalTimeSpent: 1 });

    if (!attempts || attempts.length === 0) {
      return {
        message: 'No attempts found',
        data: {
          podium: [],
          fullRanking: [],
          currentUser: null,
        },
      };
    }

    const fullRankingAll = attempts.map((a, index) => ({
      rank: index + 1,
      name: (a.user as any)?.Name || 'Unknown',
      score: a.score ?? 0,
      userId: (a.user as any)?._id?.toString() ?? a.user.toString(),
    }));
    const fullRanking = fullRankingAll.slice(0, 10);
    const podium = attempts.slice(0, 3).map((a, index) => ({
      rank: index + 1,
      name: (a.user as any)?.Name || 'Unknown',
      profilePicture: (a.user as any)?.profilePicture || '',
      score: a.score ?? 0,
    }));

    const currentUser = fullRanking.find(
      (r) => (r.userId ?? '').toString() === userId,
    );

    return {
      message: 'Ranking fetched successfully',
      data: {
        podium,
        fullRanking,
        currentUser: currentUser || null,
        totalSubmittedUsers: attempts.length,
      },
    };
  }

  async generateCertificatePdf(quizId: string, userId: string): Promise<Buffer> {
    const attempt = await this.quizAttemptModel
      .findOne({ quizId, user: userId })
      .lean();
    if (!attempt) throw new NotFoundException('User attempt not found');

    const quiz = await this.quizModel.findById(quizId).lean();
    if (!quiz) throw new NotFoundException('Quiz not found');

    const user = await this.authModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    const summary = await this.getQuizSummary(quizId, userId);
    const ranking = await this.getQuizRanking(quizId, userId);

    const totalQuestions = (quiz as any).totalQuestions ?? 0;
    const marksPerQ = (quiz as any).marksPerQuestion ?? 1;
    const maxScore = totalQuestions * marksPerQ;

    const totalStudents = await this.quizAttemptModel.countDocuments({
      quizId,
    });

    let totalGroupStudents = 0;
    if (attempt.groupId) {
      totalGroupStudents = await this.quizAttemptModel.countDocuments({
        quizId,
        groupId: attempt.groupId,
      });
    }

    const percentile: number = summary?.data?.percentile ?? 0;
    const performance =
      percentile >= 90
        ? 'Excellent'
        : percentile >= 75
          ? 'Very Good'
          : percentile >= 60
            ? 'Good'
            : percentile >= 40
              ? 'Average'
              : 'Needs Improvement';

    const data: CertificateData = {
      studentName: (user as any)?.Name || 'Student',
      testName: (quiz as any)?.title || 'Quiz',
      conductedBy: 'CLASSMATE TEST',
      groupRank: ranking?.data?.groupRank ?? 0,
      totalGroupStudents,
      allIndiaRank: summary?.data?.rank ?? 0,
      totalStudents,
      groupMatch: 'N/A',
      score: summary?.data?.score ?? attempt.score ?? 0,
      maxScore,
      performance,
      date: new Date(attempt.endTime || Date.now()).toLocaleDateString(
        'en-IN',
      ),
    };

    const defaultLogoPath = path.join('uploads', 'img', 'logo.png');
    return generateCertificate(data, defaultLogoPath);
  }
}
