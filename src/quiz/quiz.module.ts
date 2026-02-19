import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { quizModule, quizSchema } from './quiz.schema';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { QuizSchedulerService } from './quiz-scheduler.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: quizModule.name, schema: quizSchema }])],
  providers: [QuizService, QuizSchedulerService],
  controllers: [QuizController],
  exports: [QuizService],
})
export class QuizModule {}

