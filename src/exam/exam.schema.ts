import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class examModule {
  @Prop({ required: true })
  name: string;

  @Prop()
  logo: string;

  @Prop({ required: true })
  name_hi: string;
}

export const examSchema = SchemaFactory.createForClass(examModule);
