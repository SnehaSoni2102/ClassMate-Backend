import { Module } from '@nestjs/common';
import { ReportQuestionService } from './report-question.service';
import { ReportQuestionController } from './report-question.controller';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { authModule, authSchema } from 'src/users/users.schema';
import {
  reportQuestionModule,
  reportQuestionSchema,
} from './report-question.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { questionModule, questionSchema } from 'src/question/question.schema';

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
    MongooseModule.forFeature([{ name: authModule.name, schema: authSchema }]),
    MongooseModule.forFeature([
      { name: reportQuestionModule.name, schema: reportQuestionSchema },
    ]),
    MongooseModule.forFeature([
      { name: questionModule.name, schema: questionSchema },
    ]),
  ],
  providers: [ReportQuestionService, JwtStrategy],
  controllers: [ReportQuestionController],
})
export class ReportQuestionModule {}
