import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { quizModule } from './quiz.schema';
import { getQuizStartEnd } from './quiz-window.util';

@Injectable()
export class QuizSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(QuizSchedulerService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectModel(quizModule.name) private quizModel: Model<quizModule>,
  ) {}

  onModuleInit() {
    // On startup, schedule start jobs for all quizzes with future start
    this.initSchedules().catch((err) => {
      this.logger.error('Failed to initialize quiz schedules', err);
    });
  }

  private async initSchedules() {
    const now = new Date();
    const quizzes = await this.quizModel.find({}).lean();
    for (const q of quizzes) {
      try {
        const window = getQuizStartEnd(q);
        if (!window) continue;
        const { start, end } = window;

        // set status immediately if within window
        if (now >= start && now <= end) {
          await this.quizModel.updateOne({ _id: q._id }, { status: 'active' });
        } else if (now > end) {
          await this.quizModel.updateOne({ _id: q._id }, { status: 'completed' });
        }

        // schedule start if in future
        if (start > now) {
          this.scheduleJob(`quiz-start-${q._id}`, start, async () => {
            await this.quizModel.updateOne({ _id: q._id }, { status: 'active' });
            this.logger.log(`Quiz ${q._id} marked active`);
          });
        }
      } catch (err) {
        this.logger.error('Error scheduling quiz', { id: q._id, err });
      }
    }
  }

  private scheduleJob(name: string, when: Date, fn: () => Promise<void>) {
    // remove existing job if present
    try {
      const existing = this.schedulerRegistry.getTimeout(name);
      if (existing) {
        this.schedulerRegistry.deleteTimeout(name);
      }
    } catch {
      // ignore
    }

    const delay = when.getTime() - Date.now();
    if (delay <= 0) return;
    const timeout = setTimeout(async () => {
      try {
        await fn();
      } catch (err) {
        this.logger.error('Scheduled job failed', err);
      } finally {
        try {
          this.schedulerRegistry.deleteTimeout(name);
        } catch {}
      }
    }, delay);
    this.schedulerRegistry.addTimeout(name, timeout);
    this.logger.log(`Scheduled job ${name} at ${when.toISOString()}`);
  }

  public cancelJobsForQuiz(quizId: string) {
    for (const prefix of ['quiz-start-']) {
      const name = `${prefix}${quizId}`;
      try {
        const t = this.schedulerRegistry.getTimeout(name);
        if (t) this.schedulerRegistry.deleteTimeout(name);
      } catch {
        // ignore
      }
    }
  }

  public scheduleForQuiz(q: any) {
    // cancel existing then schedule new
    this.cancelJobsForQuiz(q._id?.toString?.());
    const now = new Date();
    const window = getQuizStartEnd(q);
    if (!window) return;
    const { start } = window;

    if (start > now) {
      this.scheduleJob(`quiz-start-${q._id}`, start, async () => {
        await this.quizModel.updateOne({ _id: q._id }, { status: 'active' });
        this.logger.log(`Quiz ${q._id} marked active`);
      });
    }
  }
}

