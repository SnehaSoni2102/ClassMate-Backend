import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class reportGroupModule {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'authModule' })
  user: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'groupModule' })
  group: mongoose.Types.ObjectId;

  @Prop({ type: [String], required: true })
  description: string[];
}

export const reportGroupSchema =
  SchemaFactory.createForClass(reportGroupModule);
