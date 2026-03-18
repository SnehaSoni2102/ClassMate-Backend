import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { quizModule, quizSchema } from './quiz.schema';
import { groupModule, groupSchema } from 'src/group/group.schema';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { QuizSchedulerService } from './quiz-scheduler.service';
import { questionModule, questionSchema } from 'src/question/question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: quizModule.name, schema: quizSchema },
      { name: groupModule.name, schema: groupSchema },
      { name: questionModule.name, schema: questionSchema },
    ]),
  ],
  providers: [QuizService, QuizSchedulerService],
  controllers: [QuizController],
  exports: [QuizService],
})
export class QuizModule {}

