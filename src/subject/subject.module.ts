import { Module } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { subjectModule, subjectSchema } from './subject.schema';
import { questionModule, questionSchema } from 'src/question/question.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: subjectModule.name, schema: subjectSchema },
    ]),
    MongooseModule.forFeature([
      { name: questionModule.name, schema: questionSchema },
    ]),
  ],
  providers: [SubjectService, JwtStrategy],
  controllers: [SubjectController],
})
export class SubjectModule {}
