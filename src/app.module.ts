import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationSchema } from '../env.valdiation';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoConfig } from 'config/database.config';
import { HelpSupportModule } from './help-support/help-support.module';
import { TestModule } from './test/test.module';
import { SectionModule } from './section/section.module';
import { QuestionModule } from './question/question.module';
import { UserTestAttemptModule } from './user-test-attempt/user-test-attempt.module';
import { ReportQuestionModule } from './report-question/report-question.module';
import { LibraryModule } from './library/library.module';
import { ExamModule } from './exam/exam.module';
import { CategoryModule } from './category/category.module';
import { TopicModule } from './topic/topic.module';
import { SubjectModule } from './subject/subject.module';
import { ClassModule } from './class/class.module';
import { NoticeBoardModule } from './notice-board/notice-board.module';
import { GroupModule } from './group/group.module';
import { NotificationModule } from './notification/notification.module';
import { TransactionModule } from './transaction/transaction.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { BannerModule } from './banner/banner.module';
import { UserSubscriptionModule } from './user-subscription/user-subscription.module';
import { PricingModule } from './pricing/pricing.module';
import { ReportModule } from './report/report.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './scheduler/scheduler.module';
import { QuizModule } from './quiz/quiz.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getMongoConfig,
      inject: [ConfigService],
    }),
    UsersModule,
    HelpSupportModule,
    TestModule,
    SectionModule,
    QuestionModule,
    UserTestAttemptModule,
    ReportQuestionModule,
    LibraryModule,
    ExamModule,
    CategoryModule,
    TopicModule,
    SubjectModule,
    ClassModule,
    NoticeBoardModule,
    GroupModule,
    NotificationModule,
    TransactionModule,
    SubscriptionModule,
    BannerModule,
    UserSubscriptionModule,
    PricingModule,
    ReportModule,
    // Quiz module
    QuizModule,
    // Quiz attempts
    require('./quiz-attempt/quiz-attempt.module').QuizAttemptModule,
    // Scheduler for periodic cleanup tasks (deleting tests after deletionAt)
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
