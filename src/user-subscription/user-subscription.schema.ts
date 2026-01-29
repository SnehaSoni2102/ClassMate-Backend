import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class userSubscriptionModule {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'authModule',
    required: true,
  })
  user: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transactionModule',
    required: true,
  })
  transaction: mongoose.Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'categoryModule' }],
    required: false,
    default: [],
  })
  categories?: mongoose.Types.ObjectId[];

  @Prop({ required: true })
  duration: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'groupModule',
    required: false,
  })
  group?: mongoose.Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: 'active', enum: ['active', 'cancelled', 'expired'] })
  status: string;

  @Prop({ type: Number })
  priceAtPurchase: number;
}

export const userSubscriptionSchema = SchemaFactory.createForClass(
  userSubscriptionModule,
);

userSubscriptionSchema.pre('save', function (next) {
  if (!this.categories && !this.group) {
    return next(
      new Error('Subscription must be linked to either a category or a group.'),
    );
  }
  next();
});
