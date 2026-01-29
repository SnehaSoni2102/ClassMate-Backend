import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class userTestAttemptModule {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'authModule' })
  user: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'testModule' })
  testId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  attemptedQuestions: number;

  @Prop({ required: true })
  correctAnswers: number;

  @Prop({ required: true })
  wrongAnswers: number;

  @Prop({ required: true })
  totalTimeSpent: number;

  @Prop({ required: true, enum: ['en', 'hi'] })
  languageSelected: string;

  @Prop({
    type: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'questionModule',
        },
        selectedAnswers: [String],
        timeTaken: {
          type: Number,
          default: 0,
        },
      },
    ],
    default: [],
  })
  answers: {
    questionId: mongoose.Types.ObjectId;
    selectedAnswers: string[];
    timeTaken: number;
  }[];

  @Prop({ required: true, enum: ['global', 'group'] })
  scope: 'global' | 'group';

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'groupModule',
  })
  groupId?: mongoose.Types.ObjectId;
}

export const userTestAttemptSchema = SchemaFactory.createForClass(
  userTestAttemptModule,
);

userTestAttemptSchema.index(
  { user: 1, testId: 1, scope: 1, groupId: 1 },
  { unique: true },
);
