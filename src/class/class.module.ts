import { Module } from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { classModule, classSchema } from './class.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { questionModule, questionSchema } from 'src/question/question.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: classModule.name, schema: classSchema },
    ]),
    MongooseModule.forFeature([
      { name: questionModule.name, schema: questionSchema },
    ]),
  ],
  providers: [ClassService, JwtStrategy],
  controllers: [ClassController],
})
export class ClassModule {}
