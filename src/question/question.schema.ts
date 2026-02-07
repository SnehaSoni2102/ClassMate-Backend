import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class questionModule {
  @Prop({ type: Number, unique: true })
  serial_no: number;

  @Prop({ required: false })
  image: string;

  @Prop({ required: true })
  text: string;

  @Prop()
  text_hi: string;

  @Prop({ type: [String], required: true })
  options: [string];

  @Prop({ type: [String] })
  options_hi: [string];

  @Prop({ type: [String], required: true })
  correctAnswers: string[];

  @Prop({ type: [String] })
  correctAnswers_hi: string[];

  @Prop({ required: true })
  marks: number;

  @Prop({ required: true })
  negativeMarks: number;

  @Prop({ required: true })
  isTwoOptions: boolean;

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'topicModule',
  })
  topics?: mongoose.Types.ObjectId[];

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'subjectModule',
  })
  subject?: mongoose.Types.ObjectId[];

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'classModule',
  })
  class?: mongoose.Types.ObjectId[];

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'examModule',
  })
  Exams: mongoose.Types.ObjectId[];

  @Prop()
  solution?: string;

  @Prop()
  solution_hi?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'groupModule' })
  groupId: mongoose.Types.ObjectId;
}

export const questionSchema = SchemaFactory.createForClass(questionModule);

// Create a counter schema for auto-incrementing serial_no
@Schema()
export class Counter {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true, default: 0 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
