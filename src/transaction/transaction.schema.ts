import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { TRANSACTION_USER, transactionStatus } from 'utils/helper';

@Schema({ timestamps: true })
export class transactionModule {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'authModule' })
  user: mongoose.Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop()
  mode: string;

  @Prop({
    required: true,
    enum: transactionStatus,
    type: String,
    default: transactionStatus.PENDING,
  })
  status: transactionStatus;

  @Prop({ required: true, enum: TRANSACTION_USER, type: String })
  senderMode: TRANSACTION_USER;

  @Prop({ type: Object })
  senderDetails: Record<string, any>;

  @Prop()
  currency: string;

  @Prop()
  entity: string;

  @Prop()
  receipt: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  razorpay_order: string;

  @Prop()
  orderCreatedAt: number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  notes: Record<string, any>;

  @Prop()
  razorpay_payment_id: string;

  @Prop()
  razorpay_signature: string;

  @Prop({
    type: [
      {
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'categoryModule',
          required: true,
        },
        duration: { type: Number, required: true },
      },
    ],
    default: [],
  })
  categories: { categoryId: mongoose.Types.ObjectId; duration: number }[];

  @Prop({
    type: {
      groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'groupModule' },
      duration: { type: Number },
    },
    required: false,
  })
  group?: {
    groupId: mongoose.Types.ObjectId;
    duration: number;
  };

  @Prop()
  paymentVerifiedAt: Date;

  @Prop({
    type: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'authModule',
        },
        duration: { type: Number },
      },
    ],
  })
  groupUsers: { userId: mongoose.Types.ObjectId; duration: number }[];
}

export const transactionSchema =
  SchemaFactory.createForClass(transactionModule);
