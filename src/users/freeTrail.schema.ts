import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class freeTrialModule {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'authModule',
  })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ required: true })
  days: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const freeTrialSchema = SchemaFactory.createForClass(freeTrialModule);
