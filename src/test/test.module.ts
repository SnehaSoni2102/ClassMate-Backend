import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { TestController } from './test.controller';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { authModule, authSchema } from 'src/users/users.schema';
import { testModule, testSchema } from './test.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { sectionModule, sectionSchema } from 'src/section/section.schema';
import { questionModule, questionSchema } from 'src/question/question.schema';
import { examModule, examSchema } from 'src/exam/exam.schema';
import { categoryModule, categorySchema } from 'src/category/category.schema';
import {
  userSubscriptionModule,
  userSubscriptionSchema,
} from 'src/user-subscription/user-subscription.schema';
import {
  notificationModule,
  notificationSchema,
} from 'src/notification/notification.schema';
import { bannerModule, bannerSchema } from 'src/banner/banner.schema';
import {
  userTestAttemptModule,
  userTestAttemptSchema,
} from 'src/user-test-attempt/user-test-attempt.schema';
import { freeTrialModule, freeTrialSchema } from 'src/users/freeTrail.schema';

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
    MongooseModule.forFeature([{ name: testModule.name, schema: testSchema }]),
    MongooseModule.forFeature([
      { name: sectionModule.name, schema: sectionSchema },
    ]),
    MongooseModule.forFeature([
      { name: questionModule.name, schema: questionSchema },
    ]),
    MongooseModule.forFeature([{ name: examModule.name, schema: examSchema }]),
    MongooseModule.forFeature([
      { name: categoryModule.name, schema: categorySchema },
    ]),
    MongooseModule.forFeature([
      { name: userSubscriptionModule.name, schema: userSubscriptionSchema },
    ]),
    MongooseModule.forFeature([
      { name: notificationModule.name, schema: notificationSchema },
    ]),
    MongooseModule.forFeature([
      { name: bannerModule.name, schema: bannerSchema },
    ]),
    MongooseModule.forFeature([
      { name: userTestAttemptModule.name, schema: userTestAttemptSchema },
    ]),
    MongooseModule.forFeature([
      { name: freeTrialModule.name, schema: freeTrialSchema },
    ]),
  ],
  providers: [TestService, JwtStrategy],
  controllers: [TestController],
})
export class TestModule {}
