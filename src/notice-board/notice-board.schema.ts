import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class noticeBoardModule {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'authModule' })
  user: string;

  @Prop({ required: true })
  header: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  link: string;
}

export const noticeBoardSchema =
  SchemaFactory.createForClass(noticeBoardModule);
