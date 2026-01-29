import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class libraryModule {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'authModule' })
  user: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'sectionModule' })
  section: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'questionModule' })
  question: mongoose.Types.ObjectId;
}

export const librarySchema = SchemaFactory.createForClass(libraryModule);
