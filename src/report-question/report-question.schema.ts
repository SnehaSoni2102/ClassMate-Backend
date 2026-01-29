import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class reportQuestionModule {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'authModule',
    required: true,
  })
  user: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'questionModule',
    required: true,
  })
  question: mongoose.Types.ObjectId;

  @Prop({ required: true })
  answer: string[];

  @Prop({ default: 'pending', enum: ['pending', 'resolved'] })
  status: string;
}

export const reportQuestionSchema =
  SchemaFactory.createForClass(reportQuestionModule);
