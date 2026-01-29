import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class subjectModule {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  name_hi: string;
}

export const subjectSchema = SchemaFactory.createForClass(subjectModule);
