import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class otpModule {
  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true, enum: ['signup', 'login'] })
  action: string;

  @Prop({ default: Date.now, expires: 300 })
  expiresAt: Date;
}

export const otpSchema = SchemaFactory.createForClass(otpModule);
