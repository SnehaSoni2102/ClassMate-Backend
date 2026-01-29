import { Module } from '@nestjs/common';
import { TopicService } from './topic.service';
import { TopicController } from './topic.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { topicModule, topicSchema } from './topic.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { questionModule, questionSchema } from 'src/question/question.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: topicModule.name, schema: topicSchema },
    ]),
    MongooseModule.forFeature([
      { name: questionModule.name, schema: questionSchema },
    ]),
  ],
  providers: [TopicService, JwtStrategy],
  controllers: [TopicController],
})
export class TopicModule {}
