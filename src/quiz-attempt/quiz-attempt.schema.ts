import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

class QuizAnswer {
  @Prop({ required: true })
  questionIndex: number;

  @Prop({ type: [String], default: [] })
  selectedOption?: string[];
}

@Schema({ timestamps: true })
export class quizAttemptModule {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'authModule', required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'quizModule', required: true })
  quizId: mongoose.Types.ObjectId;

  @Prop({ type: [Object], default: [] })
  answers: QuizAnswer[];

  @Prop()
  score?: number;

  @Prop()
  attemptedQuestions?: number;

  @Prop()
  correctAnswers?: number;

  @Prop()
  wrongAnswers?: number;

  @Prop()
  startTime?: Date;

  @Prop()
  endTime?: Date;

  @Prop()
  totalTimeSpent?: number;
 
  @Prop({ enum: ['global', 'group'], default: 'global' })
  scope?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'groupModule' })
  groupId?: mongoose.Types.ObjectId;

  @Prop()
  languageSelected?: string;
}

export const quizAttemptSchema = SchemaFactory.createForClass(quizAttemptModule);

