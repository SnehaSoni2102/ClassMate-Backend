import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { userTestAttemptModule } from './user-test-attempt.schema';
import mongoose, { Model } from 'mongoose';
import { AuthDocument, authModule } from 'src/users/users.schema';
import { testModule } from 'src/test/test.schema';
import { questionModule } from 'src/question/question.schema';
import { submitTestAttemptDto } from './user-test-attempt.dto';
import {
  QuestionStat,
  SectionAnalysis,
  TopicAnalysis,
} from './user-attempt.intefrace';
import { libraryModule } from 'src/library/library.schema';
import { sectionModule } from 'src/section/section.schema';
import { arraysEqual, isQuestionAnswered } from 'utils/helper';
import { examModule } from 'src/exam/exam.schema';
import { categoryModule } from 'src/category/category.schema';
import { notificationModule } from 'src/notification/notification.schema';
import { userSubscriptionModule } from 'src/user-subscription/user-subscription.schema';
import { generateCertificate, CertificateData } from 'utils/generateCertificate';
import path from 'path';

@Injectable()
export class UserTestAttemptService {
  constructor(
    @InjectModel(userTestAttemptModule.name)
    private userTestAttemptModule: Model<userTestAttemptModule>,
    @InjectModel(authModule.name) private authModule: Model<authModule>,
    @InjectModel(testModule.name) private testModule: Model<testModule>,
    @InjectModel(questionModule.name)
    private questionModule: Model<questionModule>,
    @InjectModel(libraryModule.name)
    private libraryModule: Model<libraryModule>,
    @InjectModel(sectionModule.name)
    private sectionModule: Model<sectionModule>,
    @InjectModel(notificationModule.name)
    private notificationModule: Model<notificationModule>,
    @InjectModel(userSubscriptionModule.name)
    private userSubscriptionModule: Model<userSubscriptionModule>,
  ) {}

  async submitTest(id: string, submitTestAttemptDto: submitTestAttemptDto) {
    const user = await this.authModule.findById(id);

    if (!user) {
      throw new NotAcceptableException('user not found, please signup.');
    }

    const test = await this.testModule.findById(submitTestAttemptDto.testId);

    if (!test) {
      throw new NotAcceptableException(
        'test not found, please enter correct ID',
      );
    }

    if (
      submitTestAttemptDto.scope === 'group' &&
      !submitTestAttemptDto.groupId
    ) {
      throw new NotAcceptableException(
        'groupId is required for group attempts.',
      );
    }

    if (!user.hasFreeTrial && submitTestAttemptDto.groupId) {
      const subscription = await this.userSubscriptionModule
        .findOne({
          user: id,
          group: submitTestAttemptDto.groupId,
        })
        .sort({ endDate: -1 });

      if (!subscription) {
        throw new BadRequestException(
          'No active subscription found for this group. Please purchase one.',
        );
      }

      if (
        subscription.endDate.getTime() < Date.now() ||
        subscription.status === 'expired'
      ) {
        subscription.status = 'expired';
        await subscription.save();
        throw new BadRequestException(
          'Subscription expired, please buy new subscription.',
        );
      }

      if (subscription.status === 'cancelled') {
        throw new BadRequestException(
          'Subscription cancelled, please buy new subscription.',
        );
      }
    }

    const existingAttemptQuery: any = {
      user: user._id,
      testId: submitTestAttemptDto.testId,
      scope: submitTestAttemptDto.scope,
    };
    if (submitTestAttemptDto.scope === 'group') {
      existingAttemptQuery.groupId = submitTestAttemptDto.groupId;
    }

    const existingAttempt =
      await this.userTestAttemptModule.findOne(existingAttemptQuery);
    if (existingAttempt) {
      throw new NotAcceptableException(
        submitTestAttemptDto.scope === 'global'
          ? 'You have already submitted this test globally.'
          : 'You have already submitted this test in this group.',
      );
    }

    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    let score = 0;

    const isHindi = submitTestAttemptDto.language === 'hi';

    for (const ans of submitTestAttemptDto.answers) {
      if (
        !ans.selectedAnswers ||
        !Array.isArray(ans.selectedAnswers) ||
        ans.selectedAnswers.length === 0
      )
        continue;

      attempted++;

      const question = await this.questionModule.findById(ans.questionId);
      if (!question) continue;

      const correctAnswers = (
        isHindi ? question.correctAnswers_hi : question.correctAnswers
      )
        .slice()
        .map((a) => a.trim().toLowerCase())
        .sort();

      const selectedAnswers = ans.selectedAnswers
        .slice()
        .map((a) => a.trim().toLowerCase())
        .sort();

      const isCorrect =
        correctAnswers.length === selectedAnswers.length &&
        correctAnswers.every((val, index) => val === selectedAnswers[index]);

      if (isCorrect) {
        correct++;
        score += test.marksPerQuestion;
      } else {
        wrong++;
        score -= test.negativeMarks;
      }
    }

    const totalTimeSpent =
      new Date(submitTestAttemptDto.endTime).getTime() -
      new Date(submitTestAttemptDto.startTime).getTime();

    const attempt = await this.userTestAttemptModule.create({
      user: user._id,
      testId: submitTestAttemptDto.testId,
      startTime: submitTestAttemptDto.startTime,
      endTime: submitTestAttemptDto.endTime,
      score,
      attemptedQuestions: attempted,
      correctAnswers: correct,
      wrongAnswers: wrong,
      totalTimeSpent,
      languageSelected: submitTestAttemptDto.language,
      answers: submitTestAttemptDto.answers,
      scope: submitTestAttemptDto.scope,
      groupId:
        submitTestAttemptDto.scope === 'group'
          ? submitTestAttemptDto.groupId
          : null,
    });

    user.submittedTests?.push(test._id);

    test.attemptedUsers.push(user._id);

    await test.save();

    await user.save();

    await this.notificationModule.create({
      userId: user._id,
      message: `🎯 "${test.title}" test submitted successfully.`,
      type: 'test submission',
    });

    return {
      message: 'Test Submitted successfully',
      data: attempt,
    };
  }

  async fetchAllSubmittedTest() {
    const tests = await this.userTestAttemptModule
      .find()
      .populate('user')
      .exec();

    return {
      message: 'All submitted tests fetched',
      data: tests,
    };
  }

  async getTestAnalysisById(
    testId: string,
    userId: string,
  ): Promise<{
    message: string;
    testId: string;
    userId: string;
    score: number;
    timeSpent: number;
    languageSelected: string;
    sections: SectionAnalysis[];
  }> {
    const attempt = await this.userTestAttemptModule
      .findOne({ testId, user: userId })
      .lean();
    if (!attempt) throw new NotFoundException('Test attempt not found');

    const test = await this.testModule
      .findById(testId)
      .populate({
        path: 'sections',
        model: 'sectionModule',
        populate: {
          path: 'questions',
          model: 'questionModule',
          populate: {
            path: 'topics',
            model: 'topicModule',
          },
        },
      })
      .lean();
    if (!test) throw new NotFoundException('Test not found');

    const answerMap = new Map<string, string[]>();
    for (const ans of attempt.answers) {
      answerMap.set(
        ans.questionId.toString(),
        ans.selectedAnswers.map((a) => a.toLowerCase().trim()),
      );
    }

    const language = attempt.languageSelected === 'hi' ? 'hi' : 'en';

    const sectionAnalysis: SectionAnalysis[] = [];

    for (const section of test.sections as any[]) {
      const topicMap = new Map<
        string,
        {
          topicId: string;
          topicName: string;
          questions: QuestionStat[];
        }
      >();

      const sectionQuestions: QuestionStat[] = [];

      for (let i = 0; i < section.questions.length; i++) {
        const q = section.questions[i];
        const questionId = q._id.toString();
        const questionIndex = i + 1;
        const selectedAnswers = answerMap.get(questionId) || [];

        const correctAnswers = (
          language === 'hi' ? q.correctAnswers_hi : q.correctAnswers
        ).map((a: string) => a.toLowerCase().trim());

        const isCorrect =
          selectedAnswers.length === correctAnswers.length &&
          selectedAnswers.every((a, i) => a === correctAnswers[i]);

        const questionStat: QuestionStat = {
          questionId,
          question: language === 'hi' ? q.text_hi : q.text,
          selectedAnswers,
          correctAnswers,
          isCorrect,
          index: questionIndex,
        };

        sectionQuestions.push(questionStat);

        if (Array.isArray(q.topics) && q.topics.length > 0) {
          for (const t of q.topics) {
            const topicId = t._id.toString();
            const topicName = language === 'hi' ? t.name_hi : t.name;

            if (!topicMap.has(topicId)) {
              topicMap.set(topicId, {
                topicId,
                topicName,
                questions: [],
              });
            }

            topicMap.get(topicId)?.questions.push(questionStat);
          }
        } else {
          const noTopicId = 'no-topic';
          const noTopicName = language === 'hi' ? 'कोई विषय नहीं' : 'No Topic';
          if (!topicMap.has(noTopicId)) {
            topicMap.set(noTopicId, {
              topicId: noTopicId,
              topicName: noTopicName,
              questions: [],
            });
          }
          topicMap.get(noTopicId)?.questions.push(questionStat);
        }
      }

      const topics: TopicAnalysis[] = Array.from(topicMap.values()).map(
        (topic) => {
          const totalQuestions = topic.questions.length;
          const correct = topic.questions.filter((q) => q.isCorrect).length;
          const correctPercentage =
            totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;

          return {
            ...topic,
            totalQuestions,
            correct,
            correctPercentage,
            questionIndices: topic.questions.map((q) => q.index),
          };
        },
      );

      const totalQuestions = section.questions.length;
      const answeredCount = topics.reduce(
        (acc, topic) =>
          acc +
          topic.questions.filter((q) => q.selectedAnswers.length > 0).length,
        0,
      );
      const correctCount = topics.reduce(
        (acc, topic) => acc + topic.questions.filter((q) => q.isCorrect).length,
        0,
      );
      const wrongCount = topics.reduce(
        (acc, topic) =>
          acc +
          topic.questions.filter(
            (q) => q.selectedAnswers.length > 0 && !q.isCorrect,
          ).length,
        0,
      );
      const skippedCount = totalQuestions - answeredCount;

      sectionAnalysis.push({
        sectionId: section._id.toString(),
        sectionName: language === 'hi' ? section.name_hi : section.name,
        totalQuestions,
        answered: answeredCount,
        correct: correctCount,
        wrong: wrongCount,
        skipped: skippedCount,
        correctPercentage:
          totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0,
        topics,
        questions: sectionQuestions,
      });
    }

    return {
      message: 'Analysis fetched successfully',
      testId,
      userId,
      score: attempt.score,
      timeSpent: attempt.totalTimeSpent,
      languageSelected: attempt.languageSelected,
      sections: sectionAnalysis,
    };
  }

  async getQuestionsBySectionByTestId(
    userId: string,
    testId: string,
    filter: 'all' | 'correct' | 'incorrect' | 'not_answered',
  ) {
    const result: {
      sectionId: string;
      sectionName: string;
      questions: {
        questionId: string;
        questionNumber: number;
        title: string;
        marks: number;
        isBookMarkedByMe: boolean;
        timeTaken: number;
      }[];
    }[] = [];

    let totalQuestionCount = 0;
    let matchedQuestionCount = 0;

    const attempt = await this.userTestAttemptModule
      .findOne({ user: userId, testId: testId })
      .sort({ createdAt: -1 })
      .lean();

    const test = await this.testModule
      .findById(testId)
      .populate('sections')
      .lean();

    if (!test) throw new Error('Test not found');

    const answersMap = new Map<
      string,
      { selectedAnswers: string[]; timeTaken: number }
    >();
    if (attempt) {
      for (const ans of attempt.answers) {
        answersMap.set(ans.questionId.toString(), {
          selectedAnswers: ans.selectedAnswers,
          timeTaken: ans.timeTaken || 0,
        });
      }
    }

    for (const section of test.sections) {
      const sectionData = await this.sectionModule.findById(section._id).lean();
      if (!sectionData) continue;

      const questions = await this.questionModule
        .find({ _id: { $in: sectionData.questions } })
        .lean();

      const bookmarkedQuestions = await this.libraryModule
        .find({ user: userId, section: sectionData._id })
        .lean();

      const bookmarkedQuestionIds = new Set(
        bookmarkedQuestions.map((b) => b.question.toString()),
      );

      const filtered = questions.filter((q) => {
        const userAns = answersMap.get(q._id.toString());
        const correctAnswers = q.correctAnswers;

        if (filter === 'all') return true;
        if (filter === 'correct') {
          if (!userAns) return false;
          return arraysEqual(userAns.selectedAnswers, correctAnswers);
        }
        if (filter === 'incorrect') {
          if (!userAns) return false;
          return !arraysEqual(userAns.selectedAnswers, correctAnswers);
        }
        if (filter === 'not_answered') {
          return (
            !userAns ||
            !userAns.selectedAnswers ||
            userAns.selectedAnswers.length === 0
          );
        }
        return true;
      });

      totalQuestionCount += questions.length;
      matchedQuestionCount += filtered.length;

      const questionsWithDetails = filtered.map((q, index) => {
        const userAns = answersMap.get(q._id.toString());
        const isCorrect =
          userAns && arraysEqual(userAns.selectedAnswers, q.correctAnswers);
        const isAnswered =
          userAns &&
          userAns.selectedAnswers &&
          userAns.selectedAnswers.length > 0;

        let marks = 0;
        if (isCorrect) {
          marks = q.marks;
        } else if (isAnswered) {
          marks = -q.negativeMarks;
        }

        return {
          questionId: q._id.toString(),
          questionNumber: index + 1,
          title: q.text,
          title_hi: q.text_hi,
          image: q.image,
          marks,
          isBookMarkedByMe: bookmarkedQuestionIds.has(q._id.toString()),
          timeTaken: userAns?.timeTaken || 0,
          correctAnswers: q.correctAnswers,
          selectedAnswers: userAns?.selectedAnswers || [],
        };
      });

      result.push({
        sectionId: sectionData._id.toString(),
        sectionName: sectionData.name,
        questions: questionsWithDetails,
      });
    }

    return {
      message: 'Questions fetched successfully',
      data: {
        totalQuestions: `${matchedQuestionCount}/${totalQuestionCount}`,
        sections: result,
      },
      success: true,
    };
  }

  async getQuestionDetailsById(
    userId: string,
    testId: string,
    questionId: string,
  ) {
    const attempt = await this.userTestAttemptModule
      .findOne({ user: userId, testId: testId })
      .lean();
    if (!attempt) throw new Error('Test attempt not found');

    const answer = attempt.answers.find(
      (ans) => ans.questionId.toString() === questionId,
    );

    const test = await this.testModule
      .findById(testId)
      .populate('sections')
      .lean();
    if (!test) throw new Error('Test not found');

    let questionNumber = -1;
    let sectionId: mongoose.Types.ObjectId | null = null;

    for (const section of test.sections) {
      const sectionData = await this.sectionModule.findById(section._id).lean();
      if (!sectionData) continue;

      const questionIndex = sectionData.questions
        .map((q: any) => q.toString())
        .indexOf(questionId);

      if (questionIndex !== -1) {
        questionNumber = questionIndex + 1;
        sectionId = sectionData._id;
        break;
      }
    }

    if (questionNumber === -1 || !sectionId)
      throw new Error('Question not found in test sections');

    const question = await this.questionModule.findById(questionId).lean();
    if (!question) throw new Error('Question not found');

    const bookmark = await this.libraryModule
      .findOne({ user: userId, section: sectionId, question: questionId })
      .lean();

    return {
      message: 'Question fetched successfully',
      data: {
        questionNumber,
        isBookMarkedByMe: !!bookmark,
        questionText: question.text,
        correctAnswers: question.correctAnswers,
        userSelectedAnswers: answer?.selectedAnswers || [],
        solution: question.solution || null,
      },
      success: true,
    };
  }

  async getRelatedTestTitlesByTestId(testId: string, userId: string) {
    const test = await this.testModule.findById(testId).lean();
    if (!test) {
      throw new NotAcceptableException('Test not found');
    }

    const user = await this.authModule.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found, please sign up.');
    }

    const submittedTestIds = new Set(
      (user?.submittedTests || []).map((id) => id.toString()),
    );

    const relatedTests = await this.testModule
      .find({
        _id: {
          $nin: [test._id, ...Array.from(submittedTestIds)],
        },
        exam: test.exam,
        status: 'published',
      })
      .select('title testType title_hi _id')
      .lean();

    return {
      message: 'Related tests fetched successfully',
      data: {
        originalTestTitle: test.title,
        relatedTests: relatedTests.map((t) => ({
          _id: t._id,
          title: t.title,
          testType: t.testType,
          title_hi: t.title_hi,
        })),
      },
      success: true,
    };
  }

  async getTestSummary(testId: string, userId: string) {
    const test = await this.testModule.findById(testId).populate({
      path: 'sections',
      populate: {
        path: 'questions',
        model: 'questionModule',
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    const userAttempt = await this.userTestAttemptModule.findOne({
      testId,
      user: userId,
    });

    if (!userAttempt) {
      throw new NotFoundException('User attempt not found');
    }

    const allAttempts = await this.userTestAttemptModule
      .find({ testId })
      .sort({ score: -1 });

    const rank =
      allAttempts.findIndex((a) => a.user.toString() === userId.toString()) + 1;

    const percentile = ((allAttempts.length - rank) / allAttempts.length) * 100;

    const accuracy =
      (userAttempt.correctAnswers / userAttempt.attemptedQuestions) * 100;

    const sectionStats = {};

    for (const section of test.sections as any) {
      const questionIds = section.questions.map((q) => q._id.toString());

      const answersInSection = userAttempt.answers.filter((ans) =>
        questionIds.includes(ans.questionId.toString()),
      );

      let correct = 0;
      let incorrect = 0;

      for (const ans of answersInSection) {
        const question = section.questions.find(
          (q) => q._id.toString() === ans.questionId.toString(),
        );

        const correctAnswers = question?.correctAnswers || [];

        const isCorrect =
          JSON.stringify((ans.selectedAnswers || []).sort()) ===
          JSON.stringify((correctAnswers || []).sort());

        if (isCorrect) correct++;
        else incorrect++;
      }

      const total = questionIds.length;
      sectionStats[section.name] = {
        total,
        correct,
        incorrect,
        accuracy: total ? ((correct / total) * 100).toFixed(2) : '0.00',
      };
    }

    return {
      message: 'Test attempt summary fetched successfully',
      data: {
        rank,
        percentile: +percentile.toFixed(2),
        score: userAttempt.score,
        attemptedQuestions: userAttempt.attemptedQuestions,
        correctAnswers: userAttempt.correctAnswers,
        wrongAnswers: userAttempt.wrongAnswers,
        timeSpent: userAttempt.totalTimeSpent,
        accuracy: +accuracy.toFixed(2),
        sectionStats,
      },
    };
  }

  async getTestRanking(testId: string, userId: string) {
    const allAttempts = await this.userTestAttemptModule
      .find({ testId })
      .populate('user')
      .sort({ score: -1 });

    if (!allAttempts || allAttempts.length === 0) {
      throw new NotFoundException('No attempts found for this test');
    }

    const bestAttemptsMap = new Map<string, any>();

    for (const attempt of allAttempts) {
      const uid = attempt.user._id.toString();
      if (!bestAttemptsMap.has(uid)) {
        bestAttemptsMap.set(uid, attempt);
      } else {
        const existing = bestAttemptsMap.get(uid);
        if (
          attempt.score > existing.score ||
          (!existing.groupId && attempt.groupId)
        ) {
          bestAttemptsMap.set(uid, attempt);
        }
      }
    }

    const uniqueAttempts = Array.from(bestAttemptsMap.values());

    const fullRanking = uniqueAttempts
      .sort((a, b) => b.score - a.score)
      .map((attempt, index) => {
        const user = attempt.user as any;
        return {
          rank: index + 1,
          name: user?.Name || 'User',
          score: attempt.score,
          userId: user?._id,
          groupId: attempt.groupId || null,
          globalRank: 0,
          globalScore: 0,
        };
      });

    const podium = fullRanking.slice(0, 3).map((entry) => {
      const user = allAttempts.find(
        (a) => a.user._id.toString() === entry.userId.toString(),
      )?.user as any;

      return {
        rank: entry.rank,
        name: user?.Name || 'User',
        profilePicture: user?.profilePicture || '',
        score: entry.score,
        userId: entry.userId,
        groupId: entry.groupId,
        globalRank: 0,
        globalScore: 0,
      };
    });

    const globalAttempts = await this.userTestAttemptModule
      .find({ testId, scope: 'global' })
      .populate('user')
      .sort({ score: -1 });

    const bestGlobalMap = new Map<string, any>();
    for (const attempt of globalAttempts) {
      const uid = attempt.user._id.toString();
      if (
        !bestGlobalMap.has(uid) ||
        attempt.score > bestGlobalMap.get(uid).score
      ) {
        bestGlobalMap.set(uid, attempt);
      }
    }

    const globalRanking = Array.from(bestGlobalMap.values())
      .sort((a, b) => b.score - a.score)
      .map((attempt, index) => ({
        userId: attempt.user._id.toString(),
        globalRank: index + 1,
        globalScore: attempt.score,
      }));

    const patchGlobal = (entry: any) => {
      if (!entry?.userId) return entry;

      const g = globalRanking.find((g) => g.userId === entry.userId.toString());

      if (g) {
        entry.globalRank = g.globalRank;
        entry.globalScore = g.globalScore;
      } else {
        entry.globalRank = 0;
        entry.globalScore = 0;
      }

      return entry;
    };

    const patchedFullRanking = fullRanking.map(patchGlobal);
    const patchedPodium = podium.map(patchGlobal);

    const currentUserRankObj = patchedFullRanking.find(
      (entry) => entry.userId.toString() === userId,
    );

    const globalRank = currentUserRankObj?.globalRank || null;

    let groupRank: number | null = null;
    if (currentUserRankObj?.groupId) {
      const groupRanking = patchedFullRanking
        .filter(
          (entry) =>
            entry.groupId?.toString() ===
            currentUserRankObj.groupId?.toString(),
        )
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      const currentGroupRankObj = groupRanking.find(
        (entry) => entry.userId.toString() === userId,
      );

      groupRank = currentGroupRankObj?.rank || null;
    }

    return {
      message: 'Ranking fetched successfully',
      data: {
        podium: patchedPodium,
        fullRanking: patchedFullRanking,
        currentUser: currentUserRankObj || null,
        globalRank,
        groupRank,
      },
    };
  }

  async getAllIndiaTestSubmissions(testId: string, userId: string) {
    const test = await this.testModule.findOne({
      _id: testId,
      isAllIndia: true,
    });

    if (!test) {
      throw new NotFoundException('Test not found or not an All India test');
    }

    const attempts = await this.userTestAttemptModule
      .find({ testId })
      .populate<{ user: AuthDocument }>('user')
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

    const fullRankingAll = attempts.map((attempt, index) => ({
      rank: index + 1,
      name: attempt.user?.Name || 'Unknown',
      score: attempt.score,
      userId: attempt.user?._id.toString(),
    }));

    const fullRanking = fullRankingAll.slice(0, 10);

    const podium = attempts.slice(0, 3).map((attempt, index) => ({
      rank: index + 1,
      name: attempt.user?.Name || 'Unknown',
      profilePicture: attempt.user?.profilePicture || '',
      score: attempt.score,
    }));

    const currentUser = fullRanking.find(
      (r) => r.userId.toString() === userId.toString(),
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

  async generateCertificatePdf(testId: string, userId: string): Promise<Buffer> {
    const attempt = await this.userTestAttemptModule
      .findOne({ testId, user: userId })
      .lean();
    if (!attempt) {
      throw new NotFoundException('User attempt not found');
    }

    const test = await this.testModule
      .findById(testId)
      .populate({
        path: 'sections',
        model: 'sectionModule',
        populate: {
          path: 'questions',
          model: 'questionModule',
        },
      })
      .lean();
    if (!test) {
      throw new NotFoundException('Test not found');
    }

    const user = await this.authModule.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const summary = await this.getTestSummary(testId, userId);
    const ranking = await this.getTestRanking(testId, userId);

    const totalQuestions = Array.isArray(test.sections)
      ? (test.sections as any[]).reduce(
          (acc, s) => acc + (Array.isArray(s.questions) ? s.questions.length : 0),
          0,
        )
      : 0;
    const marksPerQuestion =
      (test as any).marksPerQuestion && typeof (test as any).marksPerQuestion === 'number'
        ? (test as any).marksPerQuestion
        : 1;
    const maxScore = totalQuestions * marksPerQuestion;

    const totalStudents = await this.userTestAttemptModule.countDocuments({
      testId,
    });

    let totalGroupStudents = 0;
    if (attempt.groupId) {
      totalGroupStudents = await this.userTestAttemptModule.countDocuments({
        testId,
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
      testName: (test as any)?.title || 'Test',
      conductedBy: 'CLASSMATE TEST',
      groupRank: ranking?.data?.groupRank || 0,
      totalGroupStudents,
      allIndiaRank: summary?.data?.rank || 0,
      totalStudents,
      groupMatch: 'N/A',
      score: summary?.data?.score ?? attempt.score ?? 0,
      maxScore,
      performance,
      date: new Date(attempt.endTime || Date.now()).toLocaleDateString('en-IN'),
    };

    const defaultLogoPath = path.join('uploads', 'img', 'logo.png');
    return generateCertificate(data, defaultLogoPath);
  }
}
