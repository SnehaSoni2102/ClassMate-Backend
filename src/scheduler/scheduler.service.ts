import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { testModule } from 'src/test/test.schema';
import { sectionModule } from 'src/section/section.schema';
import { userTestAttemptModule } from 'src/user-test-attempt/user-test-attempt.schema';
import { authModule } from 'src/users/users.schema';
import { bannerModule } from 'src/banner/banner.schema';
import { quizModule } from 'src/quiz/quiz.schema';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectModel(testModule.name) private testModel: Model<testModule>,
    @InjectModel(sectionModule.name) private sectionModel: Model<sectionModule>,
    @InjectModel(userTestAttemptModule.name)
    private userTestAttemptModel: Model<userTestAttemptModule>,
    @InjectModel(authModule.name) private authModel: Model<authModule>,
    @InjectModel(bannerModule.name) private bannerModel: Model<bannerModule>,
    @InjectModel(quizModule.name) private quizModel: Model<any>,
  ) {}

  // runs every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyCleanup() {
    const now = new Date();
    try {
      // Update quiz statuses based on schedule
      try {
        const quizzes = await this.quizModel.find({ status: { $ne: 'completed' } }).lean();
        for (const q of quizzes) {
          try {
            if (!q.startDate || !q.startTime || !q.endDate || !q.endTime) continue;
            const start = new Date(q.startDate);
            const [sh, sm] = (q.startTime || '00:00').split(':').map(Number);
            start.setHours(sh, sm, 0, 0);
            const end = new Date(q.endDate);
            const [eh, em] = (q.endTime || '00:00').split(':').map(Number);
            end.setHours(eh, em, 0, 0);

            if (now > end && q.status !== 'completed') {
              await this.quizModel.updateOne({ _id: q._id }, { status: 'completed' });
            } else if (now >= start && now <= end && q.status !== 'active') {
              await this.quizModel.updateOne({ _id: q._id }, { status: 'active' });
            }
          } catch (err) {
            this.logger.error('Failed to update quiz status for', (q as any)._id, err as any);
          }
        }
      } catch (err) {
        this.logger.error('Failed to scan quizzes for status update', err as any);
      }

      const expiredTests = await this.testModel.find({
        deletionAt: { $lte: now },
      });

      if (!expiredTests || expiredTests.length === 0) return;

      for (const test of expiredTests) {
        try {
          const testId = String((test as any)._id);

          await this.userTestAttemptModel.deleteMany({ testId });
          await this.authModel.updateMany(
            { submittedTests: testId },
            { $pull: { submittedTests: testId } },
          );
          await this.bannerModel.deleteMany({ testId });

          if (Array.isArray((test as any).sections) && (test as any).sections.length > 0) {
            await this.sectionModel.deleteMany({ _id: { $in: (test as any).sections } });
          }

          await this.testModel.findByIdAndDelete(testId);
          this.logger.log(`Deleted expired test ${testId}`);
        } catch (err) {
          this.logger.error('Failed to delete expired test', err as any);
        }
      }
    } catch (err) {
      this.logger.error('Daily cleanup failed', err as any);
    }
  }
}

