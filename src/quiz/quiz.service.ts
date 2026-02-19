import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { quizModule } from './quiz.schema';
import { Model } from 'mongoose';
import { CreateQuizDto, UpdateQuizDto } from './quiz.dto';
import { QuizSchedulerService } from './quiz-scheduler.service';
import { groupModule } from 'src/group/group.schema';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(quizModule.name) private quizModel: Model<quizModule>,
    @InjectModel(groupModule.name) private groupModel: Model<any>,
    private quizScheduler: QuizSchedulerService,
  ) {}

  async create(createDto: CreateQuizDto, userId?: string) {
    // ensure scheduling fields are present (DTO validation covers this, but double-check)
    if (!createDto.startDate || !createDto.startTime || !createDto.endDate || !createDto.endTime) {
      throw new Error('startDate, startTime, endDate and endTime are required for quizzes');
    }

    const durationInSeconds = (createDto.durationInMinutes || 0) * 60;
    // prefer explicit totalQuestions from client, otherwise derive from provided questions array
    const totalQuestions = createDto.totalQuestions ?? (Array.isArray(createDto.questions) ? createDto.questions.length : 0);

    const marksPerQ = createDto.marksPerQuestion ?? 1;
    const expectedTotal = totalQuestions * marksPerQ;
    if (createDto.totalMarks != null) {
      if (createDto.totalMarks !== expectedTotal) {
        throw new BadRequestException('totalMarks must equal questions.length * marksPerQuestion');
      }
    }

    const payload: any = {
      ...createDto,
      durationInMinutes: durationInSeconds,
      totalQuestions,
      marksPerQuestion: marksPerQ,
      totalMarks: createDto.totalMarks != null ? createDto.totalMarks : expectedTotal,
      negativeMarks: createDto.negativeMarks ?? 0,
      createdBy: userId,
    };

    const doc = await this.quizModel.create(payload);
    // schedule start/end jobs for this quiz
    try {
      this.quizScheduler.scheduleForQuiz(doc);
    } catch (err) {
      // ignore scheduling errors
    }

    // set deletionAt = createdAt + 6 months
    try {
      const createdAt = (doc as any).createdAt ? new Date((doc as any).createdAt) : new Date();
      const deletionAt = new Date(createdAt);
      deletionAt.setMonth(deletionAt.getMonth() + 6);
      (doc as any).deletionAt = deletionAt;
      await doc.save();
    } catch (err) {
      // ignore
    }

    return { message: 'Quiz created', data: doc, success: true };
  }

  async createInGroup(groupId: string, createDto: CreateQuizDto, userId?: string) {
    // validate group exists
    const group = await this.groupModel.findById(groupId).lean();
    if (!group) throw new NotFoundException('Group not found');

    // reuse create logic but attach group
    const totalQuestions = createDto.totalQuestions ?? (Array.isArray(createDto.questions) ? createDto.questions.length : 0);
    const marksPerQ = createDto.marksPerQuestion ?? 1;
    const expectedTotal = totalQuestions * marksPerQ;
    if (createDto.totalMarks != null) {
      if (createDto.totalMarks !== expectedTotal) {
        throw new BadRequestException('totalMarks must equal questions.length * marksPerQuestion');
      }
    }

    const payload: any = {
      ...createDto,
      durationInMinutes: (createDto.durationInMinutes || 0) * 60,
      totalQuestions,
      marksPerQuestion: marksPerQ,
      totalMarks: createDto.totalMarks != null ? createDto.totalMarks : expectedTotal,
      negativeMarks: createDto.negativeMarks ?? 0,
      createdBy: userId,
      group: [groupId],
    };

    const doc = await this.quizModel.create(payload);
    try {
      this.quizScheduler.scheduleForQuiz(doc);
    } catch {}

    // set deletionAt
    try {
      const createdAt = (doc as any).createdAt ? new Date((doc as any).createdAt) : new Date();
      const deletionAt = new Date(createdAt);
      deletionAt.setMonth(deletionAt.getMonth() + 6);
      (doc as any).deletionAt = deletionAt;
      await doc.save();
    } catch {}

    return { message: 'Quiz created in group', data: doc, success: true };
  }

  async getActiveByGroup(groupId: string) {
    const now = new Date();
    const docs = await this.quizModel.find({
      group: groupId,
      status: { $ne: 'completed' },
    }).lean();

    const visible = docs.filter((doc: any) => {
      if (doc.status === 'active') return true;
      if (!doc.startDate || !doc.startTime || !doc.endDate || !doc.endTime) return false;
      const start = new Date(doc.startDate);
      const [sh, sm] = (doc.startTime || '00:00').split(':').map(Number);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(doc.endDate);
      const [eh, em] = (doc.endTime || '00:00').split(':').map(Number);
      end.setHours(eh, em, 0, 0);
      return now >= start && now <= end;
    });

    return { message: 'Active quizzes for group fetched', data: visible, success: true };
  }

  async findAll() {
    // Fetch quizzes that are not completed then filter to those currently active.
    const docs = await this.quizModel.find({ status: { $ne: 'completed' } }).lean();
    const now = new Date();
    const visible = docs.filter((doc: any) => {
      // If scheduler already marked it active, include it.
      if (doc.status === 'active') return true;
      // Otherwise include if current time lies within start and end window.
      if (!doc.startDate || !doc.startTime || !doc.endDate || !doc.endTime) return false;
      const start = new Date(doc.startDate);
      const [sh, sm] = (doc.startTime || '00:00').split(':').map(Number);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(doc.endDate);
      const [eh, em] = (doc.endTime || '00:00').split(':').map(Number);
      end.setHours(eh, em, 0, 0);
      return now >= start && now <= end;
    });
    return { message: 'Quizzes fetched', data: visible, success: true };
  }

  async findOne(id: string) {
    const doc = await this.quizModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Quiz not found');
    const now = new Date();
    if (!doc.startDate || !doc.startTime || !doc.endDate || !doc.endTime) {
      throw new NotFoundException('Quiz not available');
    }
    const start = new Date(doc.startDate);
    const [sh, sm] = (doc.startTime || '00:00').split(':').map(Number);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(doc.endDate);
    const [eh, em] = (doc.endTime || '00:00').split(':').map(Number);
    end.setHours(eh, em, 0, 0);
    if (now < start || now > end) throw new NotFoundException('Quiz not available at this time');
    return { message: 'Quiz fetched', data: doc, success: true };
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
    const docs = await this.quizModel.find({
      $or: [{ status: 'completed' }, { endDate: { $exists: true } }],
    }).lean();

    const completed = docs.filter((doc: any) => {
      if (doc.status === 'completed') return true;
      if (!doc.endDate || !doc.endTime) return false;
      const end = new Date(doc.endDate);
      const [eh, em] = (doc.endTime || '00:00').split(':').map(Number);
      end.setHours(eh, em, 0, 0);
      return now > end;
    });

    return { message: 'Completed quizzes fetched', data: completed, success: true };
  }

  async getInProgressQuizzes() {
    const now = new Date();
    const docs = await this.quizModel.find({ status: { $ne: 'completed' } }).lean();
    const inProgress = docs.filter((doc: any) => {
      if (doc.status === 'active') return true;
      if (!doc.startDate || !doc.startTime || !doc.endDate || !doc.endTime) return false;
      const start = new Date(doc.startDate);
      const [sh, sm] = (doc.startTime || '00:00').split(':').map(Number);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(doc.endDate);
      const [eh, em] = (doc.endTime || '00:00').split(':').map(Number);
      end.setHours(eh, em, 0, 0);
      return now >= start && now <= end;
    });
    return { message: 'In-progress quizzes fetched', data: inProgress, success: true };
  }
}

