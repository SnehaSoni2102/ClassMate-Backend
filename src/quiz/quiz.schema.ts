import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

class QuizQuestion {
  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop()
  correctOption?: string;
}

@Schema({ timestamps: true })
export class quizModule {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: [Object], default: [] })
  questions: QuizQuestion[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'authModule' })
  createdBy?: mongoose.Types.ObjectId;
 
  @Prop()
  title_hi?: string;

  @Prop()
  description_hi?: string;

  @Prop()
  totalQuestions?: number;

  @Prop()
  durationInMinutes?: number;

  @Prop()
  totalMarks?: number;

  @Prop()
  marksPerQuestion?: number;

  @Prop()
  negativeMarks?: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'examModule' })
  exam?: mongoose.Types.ObjectId;

  @Prop({ type: [String], default: [] })
  languageOptions?: string[];

  // quiz are always live
  @Prop({ enum: ['live'], default: 'live' })
  type?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  startTime?: string;

  @Prop()
  endDate?: Date;

  @Prop()
  endTime?: string;

  @Prop({ default: 'in-progress', enum: ['published', 'in-progress'] })
  status?: string;

  @Prop({ enum: ['free', 'paid'], default: 'free' })
  testType?: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'groupModule' }] })
  group?: mongoose.Types.ObjectId[];

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'authModule' })
  attemptedUsers?: mongoose.Types.ObjectId[];

  @Prop({ default: false })
  isAllIndia?: boolean;

  @Prop()
  deletionAt?: Date;
}

export const quizSchema = SchemaFactory.createForClass(quizModule);

