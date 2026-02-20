import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { quizAttemptModule, quizAttemptSchema } from './quiz-attempt.schema';
import { quizModule, quizSchema } from 'src/quiz/quiz.schema';
import { authModule, authSchema } from 'src/users/users.schema';
import { QuizAttemptService } from './quiz-attempt.service';
import { QuizAttemptController } from './quiz-attempt.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: quizAttemptModule.name, schema: quizAttemptSchema },
      { name: quizModule.name, schema: quizSchema },
      { name: authModule.name, schema: authSchema },
    ]),
  ],
  providers: [QuizAttemptService],
  controllers: [QuizAttemptController],
  exports: [QuizAttemptService],
})
export class QuizAttemptModule {}

