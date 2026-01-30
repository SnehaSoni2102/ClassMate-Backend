import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
  questionModule,
  questionSchema,
  Counter,
  CounterSchema,
} from './question.schema';
import { sectionModule, sectionSchema } from 'src/section/section.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { S3UploadService } from 'utils/s3Uploader';
import { testModule, testSchema } from 'src/test/test.schema';
import { topicModule, topicSchema } from 'src/topic/topic.schema';
import { subjectModule, subjectSchema } from 'src/subject/subject.schema';
import { examModule, examSchema } from 'src/exam/exam.schema';
import { classModule, classSchema } from 'src/class/class.schema';
import { libraryModule, librarySchema } from 'src/library/library.schema';
import {
  reportQuestionModule,
  reportQuestionSchema,
} from 'src/report-question/report-question.schema';
import {
  userTestAttemptModule,
  userTestAttemptSchema,
} from 'src/user-test-attempt/user-test-attempt.schema';
import { groupModule, groupSchema } from 'src/group/group.schema';

@Module({
  imports: [
    PassportModule,
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1y' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: sectionModule.name, schema: sectionSchema },
    ]),
    MongooseModule.forFeature([{ name: testModule.name, schema: testSchema }]),
    MongooseModule.forFeature([
      { name: questionModule.name, schema: questionSchema },
    ]),
    MongooseModule.forFeature([
      { name: topicModule.name, schema: topicSchema },
    ]),
    MongooseModule.forFeature([
      { name: subjectModule.name, schema: subjectSchema },
    ]),
    MongooseModule.forFeature([{ name: examModule.name, schema: examSchema }]),
    MongooseModule.forFeature([
      { name: classModule.name, schema: classSchema },
    ]),
    MongooseModule.forFeature([
      { name: libraryModule.name, schema: librarySchema },
    ]),
    MongooseModule.forFeature([
      { name: reportQuestionModule.name, schema: reportQuestionSchema },
    ]),
    MongooseModule.forFeature([
      { name: userTestAttemptModule.name, schema: userTestAttemptSchema },
    ]),
    MongooseModule.forFeature([
      { name: groupModule.name, schema: groupSchema },
    ]),
    MongooseModule.forFeature([{ name: Counter.name, schema: CounterSchema }]),
  ],
  providers: [QuestionService, JwtStrategy, S3UploadService],
  controllers: [QuestionController],
})
export class QuestionModule {}
