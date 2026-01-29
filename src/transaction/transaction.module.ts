import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { transactionModule, transactionSchema } from './transaction.schema';
import { authModule, authSchema } from 'src/users/users.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { categoryModule, categorySchema } from 'src/category/category.schema';
import { groupModule, groupSchema } from 'src/group/group.schema';
import {
  subscriptionModule,
  subscriptionSchema,
} from 'src/subscription/subscription.schema';
import {
  userSubscriptionModule,
  userSubscriptionSchema,
} from 'src/user-subscription/user-subscription.schema';
import {
  notificationModule,
  notificationSchema,
} from 'src/notification/notification.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: transactionModule.name, schema: transactionSchema },
    ]),
    MongooseModule.forFeature([{ name: authModule.name, schema: authSchema }]),
    MongooseModule.forFeature([
      { name: categoryModule.name, schema: categorySchema },
    ]),
    MongooseModule.forFeature([
      { name: groupModule.name, schema: groupSchema },
    ]),
    MongooseModule.forFeature([
      { name: subscriptionModule.name, schema: subscriptionSchema },
    ]),
    MongooseModule.forFeature([
      { name: userSubscriptionModule.name, schema: userSubscriptionSchema },
    ]),
    MongooseModule.forFeature([
      { name: notificationModule.name, schema: notificationSchema },
    ]),
  ],
  providers: [TransactionService, JwtStrategy],
  controllers: [TransactionController],
})
export class TransactionModule {}
