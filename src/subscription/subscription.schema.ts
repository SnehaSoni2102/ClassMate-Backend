import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class subscriptionModule {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  billingCycle: number;

  @Prop({ default: 0 })
  discountPercentage: number;

  @Prop()
  minCategoriesForDiscount: number;
}

export const subscriptionSchema =
  SchemaFactory.createForClass(subscriptionModule);
