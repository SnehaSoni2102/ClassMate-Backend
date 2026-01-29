import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class authModule {
  @Prop()
  phoneNumber: string;

  @Prop()
  language?: string;

  @Prop()
  Name?: string;

  @Prop()
  email?: string;

  @Prop({ trim: true })
  password: string;

  @Prop({ enum: ['admin', 'superadmin', 'student'] })
  role: string;

  @Prop({ default: false })
  isOnBoardingCompleted: boolean;

  @Prop({ default: Date.now() })
  lastLogin: Date;

  @Prop()
  profilePicture?: string;

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'testModule',
  })
  submittedTests?: mongoose.Types.ObjectId[];

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'categoryModule' })
  categories?: mongoose.Types.ObjectId[];

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'examModule' })
  exams?: mongoose.Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'groupModule' }],
  })
  myGroups?: mongoose.Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'groupModule' }],
  })
  invitedGroups?: mongoose.Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'groupModule' }],
  })
  requestedToJoinGroups?: mongoose.Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  hasFreeTrial: boolean;
}

export const authSchema = SchemaFactory.createForClass(authModule);

export type AuthDocument = authModule &
  Document & { _id: mongoose.Types.ObjectId };
