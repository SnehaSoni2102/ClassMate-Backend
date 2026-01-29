import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { authModule, authSchema } from 'src/users/users.schema';
import { notificationModule, notificationSchema } from './notification.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { PassportModule } from '@nestjs/passport';
import { testModule, testSchema } from 'src/test/test.schema';
import {
  userSubscriptionModule,
  userSubscriptionSchema,
} from 'src/user-subscription/user-subscription.schema';
import { groupModule, groupSchema } from 'src/group/group.schema';
import { freeTrialModule, freeTrialSchema } from 'src/users/freeTrail.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([{ name: authModule.name, schema: authSchema }]),
    MongooseModule.forFeature([
      { name: notificationModule.name, schema: notificationSchema },
    ]),
    MongooseModule.forFeature([{ name: testModule.name, schema: testSchema }]),
    MongooseModule.forFeature([
      { name: userSubscriptionModule.name, schema: userSubscriptionSchema },
    ]),
    MongooseModule.forFeature([
      { name: groupModule.name, schema: groupSchema },
    ]),
    MongooseModule.forFeature([
      { name: freeTrialModule.name, schema: freeTrialSchema },
    ]),
  ],
  providers: [NotificationService, JwtStrategy],
  controllers: [NotificationController],
})
export class NotificationModule {}
