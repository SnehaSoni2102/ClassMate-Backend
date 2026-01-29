import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class categoryModule {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  name_hi: string;

  @Prop()
  description: string;

  @Prop()
  description_hi: string;

  @Prop({ required: true })
  logo: string;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'examModule' })
  exams: mongoose.Types.ObjectId[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categoryModule',
    default: null,
  })
  parent: mongoose.Types.ObjectId | null;

  @Prop({
    type: [
      {
        duration: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    required: true,
    default: [],
  })
  pricingPlans: { duration: number; price: number }[];
}

export const categorySchema = SchemaFactory.createForClass(categoryModule);
