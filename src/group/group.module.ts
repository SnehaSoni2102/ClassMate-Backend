import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { MongooseModule } from '@nestjs/mongoose';
import { groupModule, groupSchema } from './group.schema';
import { authModule, authSchema } from 'src/users/users.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { S3UploadService } from 'utils/s3Uploader';
import { testModule, testSchema } from 'src/test/test.schema';
import {
  notificationModule,
  notificationSchema,
} from 'src/notification/notification.schema';
import { sectionModule, sectionSchema } from 'src/section/section.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  userTestAttemptModule,
  userTestAttemptSchema,
} from 'src/user-test-attempt/user-test-attempt.schema';
import {
  pricingPlansModule,
  pricingPlansSchema,
} from 'src/pricing/pricing.schema';
import {
  userSubscriptionModule,
  userSubscriptionSchema,
} from 'src/user-subscription/user-subscription.schema';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1y' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: groupModule.name, schema: groupSchema },
    ]),
    MongooseModule.forFeature([{ name: authModule.name, schema: authSchema }]),
    MongooseModule.forFeature([{ name: testModule.name, schema: testSchema }]),
    MongooseModule.forFeature([
      { name: notificationModule.name, schema: notificationSchema },
    ]),
    MongooseModule.forFeature([
      { name: sectionModule.name, schema: sectionSchema },
    ]),
    MongooseModule.forFeature([
      { name: userTestAttemptModule.name, schema: userTestAttemptSchema },
    ]),
    MongooseModule.forFeature([
      { name: pricingPlansModule.name, schema: pricingPlansSchema },
    ]),
    MongooseModule.forFeature([
      { name: userSubscriptionModule.name, schema: userSubscriptionSchema },
    ]),
  ],
  controllers: [GroupController],
  providers: [GroupService, JwtStrategy, S3UploadService],
})
export class GroupModule {}
