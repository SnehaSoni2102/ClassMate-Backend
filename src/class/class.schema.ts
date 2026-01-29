import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class classModule {
  @Prop({ required: true })
  name: string;
}

export const classSchema = SchemaFactory.createForClass(classModule);
