import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema()
export class pricingPlansModule {
  @Prop({
    type: [{ duration: Number, price: Number }],
    default: [],
  })
  plans: { duration: number; price: number }[];

  @Prop({ required: true, enum: ['category', 'group'] })
  type: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'authModule' })
  updatedBy: mongoose.Types.ObjectId;
}

export const pricingPlansSchema =
  SchemaFactory.createForClass(pricingPlansModule);
