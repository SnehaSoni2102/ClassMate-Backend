import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class testModule {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'authModule',
  })
  user: mongoose.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  title_hi: string;

  @Prop({ required: true })
  totalQuestions: number;

  @Prop({ required: true })
  totalSections: number;

  @Prop({ required: true })
  durationInMinutes: number;

  @Prop({ required: true })
  totalMarks: number;

  @Prop({ required: true })
  marksPerQuestion: number;

  @Prop({ required: true })
  negativeMarks: number;

  @Prop()
  description?: string;

  @Prop()
  description_hi?: string;

  @Prop({ type: [String], required: true, enum: ['English', 'Hindi'] })
  languageOptions: string[];

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'sectionModule',
    default: [],
  })
  sections: mongoose.Types.ObjectId[];

  @Prop({ required: true, enum: ['mock', 'live'] })
  type: string;

  @Prop()
  startDate: Date;

  @Prop()
  startTime: string;

  @Prop()
  endDate: Date;

  @Prop()
  endTime: string;

  @Prop({ default: 'in-progress', enum: ['published', 'in-progress'] })
  status: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'examModule' })
  exam: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: ['free', 'paid'] })
  testType: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'groupModule' }],
  })
  group?: mongoose.Types.ObjectId[];

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'authModule',
  })
  attemptedUsers: mongoose.Types.ObjectId[];

  @Prop({ default: false })
  isAllIndia: boolean;
}

export const testSchema = SchemaFactory.createForClass(testModule);
