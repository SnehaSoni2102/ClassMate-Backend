import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { quizAttemptModule, quizAttemptSchema } from './quiz-attempt.schema';
import { quizModule, quizSchema } from 'src/quiz/quiz.schema';
import { authModule, authSchema } from 'src/users/users.schema';
import { notificationModule, notificationSchema } from 'src/notification/notification.schema';
import { userSubscriptionModule, userSubscriptionSchema } from 'src/user-subscription/user-subscription.schema';
import { questionModule, questionSchema } from 'src/question/question.schema';
import { QuizAttemptService } from './quiz-attempt.service';
import { QuizAttemptController } from './quiz-attempt.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: quizAttemptModule.name, schema: quizAttemptSchema },
      { name: quizModule.name, schema: quizSchema },
      { name: authModule.name, schema: authSchema },
      { name: notificationModule.name, schema: notificationSchema },
      { name: userSubscriptionModule.name, schema: userSubscriptionSchema },
      { name: questionModule.name, schema: questionSchema },
    ]),
  ],
  providers: [QuizAttemptService],
  controllers: [QuizAttemptController],
  exports: [QuizAttemptService],
})
export class QuizAttemptModule {}

