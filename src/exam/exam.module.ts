import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { examModule, examSchema } from './exam.schema';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { S3UploadService } from 'utils/s3Uploader';
import { categoryModule, categorySchema } from 'src/category/category.schema';
import { questionModule, questionSchema } from 'src/question/question.schema';

@Module({
  imports: [
    PassportModule,
    ConfigModule.forRoot(),
    MongooseModule.forFeature([{ name: examModule.name, schema: examSchema }]),
    MongooseModule.forFeature([
      { name: categoryModule.name, schema: categorySchema },
    ]),
    MongooseModule.forFeature([
      { name: questionModule.name, schema: questionSchema },
    ]),
  ],
  providers: [ExamService, JwtStrategy, S3UploadService],
  controllers: [ExamController],
})
export class ExamModule {}
