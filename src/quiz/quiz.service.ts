import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { quizModule } from './quiz.schema';
import { Model } from 'mongoose';
import { CreateQuizDto, UpdateQuizDto } from './quiz.dto';
import { QuizSchedulerService } from './quiz-scheduler.service';
import { groupModule } from 'src/group/group.schema';
import { questionModule } from 'src/question/question.schema';
import mongoose from 'mongoose';
import { getQuizStartEnd, getQuizTimeStatus } from './quiz-window.util';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(quizModule.name) private quizModel: Model<quizModule>,
    @InjectModel(groupModule.name) private groupModel: Model<any>,
    private quizScheduler: QuizSchedulerService,
    @InjectModel(questionModule.name) private questionModel: Model<questionModule>,
  ) {}

  async create(createDto: CreateQuizDto, userId?: string) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    let scheduleNow = !!createDto.scheaduleNow;
    const now = new Date();

    const questions = Array.isArray(createDto.questions)
      ? createDto.questions
      : [];
    if (questions.length === 0) {
      throw new BadRequestException('questions are required');
    }

    const questionIds = questions.map((q) => q.questionId);
    const questionTimesFromQuestions = questions.map((q) => q.timeInMinutes);

    const questionsLen = questionIds.length;
    const totalDurationMinutes = questionTimesFromQuestions.reduce(
      (acc, v) => acc + v,
      0,
    );

    if (!totalDurationMinutes || totalDurationMinutes <= 0) {
      throw new BadRequestException(
        'questions[].timeInMinutes must result in a positive total duration',
      );
    }

    if (
      createDto.durationInMinutes != null &&
      createDto.durationInMinutes !== totalDurationMinutes
    ) {
      throw new BadRequestException(
        'durationInMinutes must match sum of questions[].timeInMinutes',
      );
    }

    let startDt: Date;
    if (scheduleNow) {
      startDt = now;
    } else {
      if (!createDto.startDate || !createDto.startTime) {
        throw new BadRequestException(
          'startDate and startTime are required when scheaduleNow is false',
        );
      }
      const d = new Date(createDto.startDate);
      const [sh, sm] = createDto.startTime.split(':').map(Number);
      d.setHours(sh, sm, 0, 0);
      // If startDate/startTime already passed, start immediately.
      startDt = d <= now ? now : d;
      if (d <= now) scheduleNow = true;
    }

    const startDate = scheduleNow ? formatDate(startDt) : createDto.startDate!;
    const startTime = scheduleNow ? formatTime(startDt) : createDto.startTime!;

    const durationInSeconds = totalDurationMinutes * 60;

    // prefer explicit totalQuestions from client, otherwise derive from provided questions array
    const totalQuestions = createDto.totalQuestions ?? questionsLen;

    const marksPerQ = createDto.marksPerQuestion ?? 1;
    const expectedTotal = totalQuestions * marksPerQ;
    if (createDto.totalMarks != null && createDto.totalMarks !== expectedTotal) {
      throw new BadRequestException(
        'totalMarks must equal questions.length * marksPerQuestion',
      );
    }

    const { endDate: _omitEndDate, endTime: _omitEndTime, ...createDtoRest } =
      createDto;

    const payload: any = {
      ...createDtoRest,
      // normalize scheduling fields (especially for scheaduleNow=true)
      questions,
      startDate,
      startTime,
      durationInMinutes: durationInSeconds,
      totalQuestions,
      marksPerQuestion: marksPerQ,
      totalMarks:
        createDto.totalMarks != null ? createDto.totalMarks : expectedTotal,
      negativeMarks: createDto.negativeMarks ?? 0,
      createdBy: userId,
      status: scheduleNow ? 'active' : undefined,
    };

    const doc = await this.quizModel.create(payload);

    // schedule start job for future quizzes
    try {
      this.quizScheduler.scheduleForQuiz(doc);
    } catch {
      // ignore scheduling errors
    }

    // set deletionAt = createdAt + 6 months
    try {
      const createdAt = (doc as any).createdAt
        ? new Date((doc as any).createdAt)
        : new Date();
      const deletionAt = new Date(createdAt);
      deletionAt.setMonth(deletionAt.getMonth() + 6);
      (doc as any).deletionAt = deletionAt;
      await doc.save();
    } catch {
      // ignore
    }

    return { message: 'Quiz created', data: doc, success: true };
  }

  async createInGroup(groupId: string, createDto: CreateQuizDto, userId?: string) {
    // validate group exists
    const group = await this.groupModel.findById(groupId).lean();
    if (!group) throw new NotFoundException('Group not found');

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    let scheduleNow = !!createDto.scheaduleNow;
    const now = new Date();

    const questions = Array.isArray(createDto.questions)
      ? createDto.questions
      : [];
    if (questions.length === 0) {
      throw new BadRequestException('questions are required');
    }

    const questionIds = questions.map((q) => q.questionId);
    const questionTimesFromQuestions = questions.map((q) => q.timeInMinutes);

    const questionsLen = questionIds.length;
    const totalDurationMinutes = questionTimesFromQuestions.reduce(
      (acc, v) => acc + v,
      0,
    );

    if (!totalDurationMinutes || totalDurationMinutes <= 0) {
      throw new BadRequestException(
        'questions[].timeInMinutes must result in a positive total duration',
      );
    }

    if (
      createDto.durationInMinutes != null &&
      createDto.durationInMinutes !== totalDurationMinutes
    ) {
      throw new BadRequestException(
        'durationInMinutes must match sum of questions[].timeInMinutes',
      );
    }

    let startDt: Date;
    if (scheduleNow) {
      startDt = now;
    } else {
      if (!createDto.startDate || !createDto.startTime) {
        throw new BadRequestException(
          'startDate and startTime are required when scheaduleNow is false',
        );
      }
      const d = new Date(createDto.startDate);
      const [sh, sm] = createDto.startTime.split(':').map(Number);
      d.setHours(sh, sm, 0, 0);
      startDt = d <= now ? now : d;
      if (d <= now) scheduleNow = true;
    }

    const startDate = scheduleNow ? formatDate(startDt) : createDto.startDate!;
    const startTime = scheduleNow ? formatTime(startDt) : createDto.startTime!;

    const durationInSeconds = totalDurationMinutes * 60;

    const totalQuestions = createDto.totalQuestions ?? questionsLen;

    const marksPerQ = createDto.marksPerQuestion ?? 1;
    const expectedTotal = totalQuestions * marksPerQ;
    if (createDto.totalMarks != null && createDto.totalMarks !== expectedTotal) {
      throw new BadRequestException(
        'totalMarks must equal questions.length * marksPerQuestion',
      );
    }

    const { endDate: _omitEndDate2, endTime: _omitEndTime2, ...createDtoRest2 } =
      createDto;

    const payload: any = {
      ...createDtoRest2,
      questions,
      startDate,
      startTime,
      durationInMinutes: durationInSeconds,
      totalQuestions,
      marksPerQuestion: marksPerQ,
      totalMarks:
        createDto.totalMarks != null ? createDto.totalMarks : expectedTotal,
      negativeMarks: createDto.negativeMarks ?? 0,
      createdBy: userId,
      group: [groupId],
      status: scheduleNow ? 'active' : undefined,
    };

    const doc = await this.quizModel.create(payload);
    try {
      this.quizScheduler.scheduleForQuiz(doc);
    } catch {
      // ignore
    }

    // set deletionAt = createdAt + 6 months
    try {
      const createdAt = (doc as any).createdAt
        ? new Date((doc as any).createdAt)
        : new Date();
      const deletionAt = new Date(createdAt);
      deletionAt.setMonth(deletionAt.getMonth() + 6);
      (doc as any).deletionAt = deletionAt;
      await doc.save();
    } catch {
      // ignore
    }

    return { message: 'Quiz created in group', data: doc, success: true };
  }

  async getActiveByGroup(groupId: string) {
    const now = new Date();
    const docs = await this.quizModel.find({
      group: groupId,
      status: { $ne: 'completed' },
    }).lean();

    const visible = docs
      .filter((doc: any) => getQuizTimeStatus(doc, now) === 'active')
      .map((doc: any) => ({ ...doc, status: 'active' }));

    return { message: 'Active quizzes for group fetched', data: visible, success: true };
  }

  async getUpcommingByGroup(groupId: string) {
    const now = new Date();
    const docs = await this.quizModel
      .find({
        group: groupId,
        status: { $ne: 'completed' },
      })
      .lean();

    const upcomming = docs.filter(
      (doc: any) => getQuizTimeStatus(doc, now) === 'upcomming',
    );

    return {
      message: 'Upcomming quizzes for group fetched',
      data: upcomming,
      success: true,
    };
  }

  async getCompletedByGroup(groupId: string) {
    const now = new Date();
    const docs = await this.quizModel.find({ group: groupId }).lean();

    const completed = docs.filter((doc: any) => {
      if (doc.status === 'completed') return true;
      const window = getQuizStartEnd(doc);
      if (!window) return false;
      return now > window.end;
    });

    return {
      message: 'Completed quizzes for group fetched',
      data: completed,
      success: true,
    };
  }

  async findAll() {
    // Fetch quizzes that are not completed then filter to those currently active.
    const docs = await this.quizModel.find({ status: { $ne: 'completed' } }).lean();
    const now = new Date();
    const visible = docs
      .filter((doc: any) => getQuizTimeStatus(doc, now) === 'active')
      .map((doc: any) => ({ ...doc, status: 'active' }));
    return { message: 'Quizzes fetched', data: visible, success: true };
  }

  async findOne(id: string) {
    const doc = await this.quizModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Quiz not found');
    const now = new Date();

    let isAvailableNow = false;
    let availability: 'upcomming' | 'active' | 'completed' | 'unknown' = 'unknown';

    const window = getQuizStartEnd(doc);
    const timeStatus = getQuizTimeStatus(doc, now);
    if (window) {
      if (now < window.start) {
        availability = 'upcomming';
        isAvailableNow = false;
      } else if (now > window.end) {
        availability = 'completed';
        isAvailableNow = false;
      } else {
        availability = 'active';
        isAvailableNow = true;
      }
    }

    const questionEntries = Array.isArray((doc as any).questions)
      ? (doc as any).questions
      : [];
    const questionIds = questionEntries
      .map((q: any) => q?.questionId)
      .filter(Boolean)
      .map((id: any) => {
        // Ensure we query using ObjectId so `$in` matches reliably.
        return mongoose.Types.ObjectId.isValid(String(id))
          ? new mongoose.Types.ObjectId(String(id))
          : id;
      });

    const questionsDocs = questionIds.length
      ? await this.questionModel
          .find({ _id: { $in: questionIds } })
          .lean()
      : [];

    const questionMap = new Map(
      questionsDocs.map((q: any) => [String(q._id), q]),
    );

    const populatedQuestions = questionEntries.map((entry: any) => {
      const qId = String(entry?.questionId);
      const q = questionMap.get(qId);
      // Keep timeInMinutes along with the fully populated question document
      return q ? { ...q, timeInMinutes: entry?.timeInMinutes } : entry;
    });

    const resolvedStatus =
      timeStatus !== 'unknown' ? timeStatus : (doc as any).status;

    return {
      message: 'Quiz fetched',
      data: {
        ...doc,
        status: resolvedStatus,
        questions: populatedQuestions,
        isAvailableNow,
        availability,
      },
      success: true,
    };
  }

  async update(id: string, updateDto: UpdateQuizDto) {
    if (updateDto.durationInMinutes) {
      (updateDto as any).durationInMinutes = updateDto.durationInMinutes * 60;
    }

    // Validate or auto-calculate totalMarks when questions or marksPerQuestion change
    const existing = await this.quizModel.findById(id).lean();
    if (!existing) throw new NotFoundException('Quiz not found');

    const totalQuestions = updateDto.questions ? updateDto.questions.length : existing.totalQuestions ?? 0;
    const marksPerQ = updateDto.marksPerQuestion ?? existing.marksPerQuestion ?? 1;
    const expectedTotal = totalQuestions * marksPerQ;
    if (updateDto.totalMarks != null) {
      if (updateDto.totalMarks !== expectedTotal) {
        throw new BadRequestException('totalMarks must equal questions.length * marksPerQuestion');
      }
    } else {
      (updateDto as any).totalMarks = expectedTotal;
    }
    (updateDto as any).marksPerQuestion = marksPerQ;
    if ((updateDto as any).negativeMarks == null && existing.negativeMarks != null) {
      (updateDto as any).negativeMarks = existing.negativeMarks;
    }

    // set deletionAt = now + 6 months (atomic)
    const now = new Date();
    const deletionAt = new Date(now);
    deletionAt.setMonth(deletionAt.getMonth() + 6);
    (updateDto as any).deletionAt = deletionAt;

    const doc = await this.quizModel.findByIdAndUpdate(id, updateDto, { new: true });
    if (!doc) throw new NotFoundException('Quiz not found');
    try {
      this.quizScheduler.cancelJobsForQuiz(id);
      this.quizScheduler.scheduleForQuiz(doc);
    } catch (err) {
      // ignore
    }
    return { message: 'Quiz updated', data: doc, success: true };
  }

  async remove(id: string) {
    const doc = await this.quizModel.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException('Quiz not found');
    return { message: 'Quiz deleted', success: true };
  }

  async getCompletedQuizzes() {
    const now = new Date();
    // quizzes explicitly marked completed or whose end datetime is past
    const docs = await this.quizModel.find({}).lean();

    const completed = docs.filter((doc: any) => {
      if (doc.status === 'completed') return true;
      const window = getQuizStartEnd(doc);
      if (!window) return false;
      return now > window.end;
    });

    return { message: 'Completed quizzes fetched', data: completed, success: true };
  }

  async getUpcommingQuizzes() {
    const now = new Date();
    const docs = await this.quizModel.find({ status: { $ne: 'completed' } }).lean();
    const upcomming = docs.filter(
      (doc: any) =>
        doc.status !== 'completed' &&
        getQuizTimeStatus(doc, now) === 'upcomming',
    );
    return {
      message: 'Upcomming quizzes fetched',
      data: upcomming,
      success: true,
    };
  }
}

