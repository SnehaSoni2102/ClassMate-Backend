import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class notificationModule {
  @Prop({ type: Types.ObjectId, ref: 'authModule', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  image?: string;

  @Prop()
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'groupModule' })
  groupId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'categoryModule' })
  category?: Types.ObjectId;

  @Prop({ enum: ['pending', 'accepted', 'rejected', 'removed'] })
  invitationStatus?: string;

  @Prop({ default: false })
  sent: boolean;

  @Prop({ type: Types.ObjectId, ref: 'authModule' })
  requestedUserId?: Types.ObjectId;
}

export const notificationSchema =
  SchemaFactory.createForClass(notificationModule);
