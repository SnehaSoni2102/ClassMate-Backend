import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class bannerModule {
  @Prop({ required: true })
  image: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'testModule' })
  testId: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: ['test', 'payment', 'other'] })
  type: string;
}

export const bannerSchema = SchemaFactory.createForClass(bannerModule);
