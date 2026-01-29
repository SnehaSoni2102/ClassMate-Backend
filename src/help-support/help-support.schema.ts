import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class helpSupportModule {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'authModule' })
  user: string;

  @Prop({ required: true, enum: ['general', 'technical', 'billing'] })
  category: string;

  @Prop({ required: true })
  issue: string;
}

export const helpSupportSchema =
  SchemaFactory.createForClass(helpSupportModule);
