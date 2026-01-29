import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class topicModule {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  name_hi: string;
}

export const topicSchema = SchemaFactory.createForClass(topicModule);
