import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class sectionModule {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'authModule',
  })
  user: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  name_hi: string;

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'questionModule',
    default: [],
  })
  questions: mongoose.Types.ObjectId[];

  @Prop()
  order?: number;

  @Prop()
  timeLimit?: number;
}

export const sectionSchema = SchemaFactory.createForClass(sectionModule);
