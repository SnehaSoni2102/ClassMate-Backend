import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export enum GroupCreatedBy {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

@Schema({ timestamps: true })
export class groupModule {
  @Prop({ required: true, unique: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  logo?: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'authModule',
    required: true,
  })
  admin: mongoose.Types.ObjectId;

  @Prop({
    type: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'authModule' },
        role: {
          type: String,
          enum: ['group-admin', 'group-manager', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  })
  members: {
    user: mongoose.Types.ObjectId;
    role: 'group-admin' | 'group-manager' | 'member';
    joinedAt: Date;
  }[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'authModule' }],
    default: [],
  })
  invitedUsers: mongoose.Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'authModule' }],
    default: [],
  })
  joinRequests: mongoose.Types.ObjectId[];

  @Prop({ type: String, enum: Object.values(GroupCreatedBy), required: true })
  createdBy: GroupCreatedBy;

  @Prop({
    type: [
      {
        price: { type: Number, required: true },
        duration: { type: Number, required: true },
      },
    ],
    default: [],
  })
  pricePerStudent: {
    price: number;
    duration: number;
  }[];

  @Prop()
  whatsappLink: string;

  @Prop()
  youtubeLink: string;
}

export const groupSchema = SchemaFactory.createForClass(groupModule);
