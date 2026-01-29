import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class youtubeModule {
  @Prop({ required: true })
  youtubeLink: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  title_hi: string;
}

export const youtubeSchema = SchemaFactory.createForClass(youtubeModule);
