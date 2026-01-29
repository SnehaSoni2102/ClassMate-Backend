import { Module } from '@nestjs/common';
import { UserTestAttemptService } from './user-test-attempt.service';
import { UserTestAttemptController } from './user-test-attempt.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { authModule, authSchema } from 'src/users/users.schema';
import {
  userTestAttemptModule,
  userTestAttemptSchema,
} from './user-test-attempt.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { testModule, testSchema } from 'src/test/test.schema';
import { questionModule, questionSchema } from 'src/question/question.schema';
import { libraryModule, librarySchema } from 'src/library/library.schema';
import { sectionModule, sectionSchema } from 'src/section/section.schema';
import {
  notificationModule,
  notificationSchema,
} from 'src/notification/notification.schema';
import {
  userSubscriptionModule,
  userSubscriptionSchema,
} from 'src/user-subscription/user-subscription.schema';

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
      { name: questionModule.name, schema: questionSchema },
    ]),
    MongooseModule.forFeature([
      { name: userTestAttemptModule.name, schema: userTestAttemptSchema },
    ]),
    MongooseModule.forFeature([
      { name: libraryModule.name, schema: librarySchema },
    ]),
    MongooseModule.forFeature([
      { name: sectionModule.name, schema: sectionSchema },
    ]),
    MongooseModule.forFeature([
      { name: notificationModule.name, schema: notificationSchema },
    ]),
    MongooseModule.forFeature([
      { name: userSubscriptionModule.name, schema: userSubscriptionSchema },
    ]),
  ],
  providers: [UserTestAttemptService, JwtStrategy],
  controllers: [UserTestAttemptController],
})
export class UserTestAttemptModule {}
