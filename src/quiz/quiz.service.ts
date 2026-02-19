import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { quizModule } from './quiz.schema';
import { Model } from 'mongoose';
import { CreateQuizDto, UpdateQuizDto } from './quiz.dto';
import { QuizSchedulerService } from './quiz-scheduler.service';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(quizModule.name) private quizModel: Model<quizModule>,
    private quizScheduler: QuizSchedulerService,
  ) {}

  async create(createDto: CreateQuizDto, userId?: string) {
    // ensure scheduling fields are present (DTO validation covers this, but double-check)
    if (!createDto.startDate || !createDto.startTime || !createDto.endDate || !createDto.endTime) {
      throw new Error('startDate, startTime, endDate and endTime are required for quizzes');
    }

    const durationInSeconds = (createDto.durationInMinutes || 0) * 60;
    const totalQuestions = Array.isArray(createDto.questions) ? createDto.questions.length : 0;

    const payload: any = {
      ...createDto,
      durationInMinutes: durationInSeconds,
      totalQuestions,
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

