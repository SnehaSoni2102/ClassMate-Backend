import { Module } from '@nestjs/common';
import { UserSubscriptionService } from './user-subscription.service';
import { UserSubscriptionController } from './user-subscription.controller';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import {
  userSubscriptionModule,
  userSubscriptionSchema,
} from './user-subscription.schema';
import { categoryModule, categorySchema } from 'src/category/category.schema';
import { groupModule, groupSchema } from 'src/group/group.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: userSubscriptionModule.name, schema: userSubscriptionSchema },
    ]),
    MongooseModule.forFeature([
      { name: categoryModule.name, schema: categorySchema },
    ]),
    MongooseModule.forFeature([
      { name: groupModule.name, schema: groupSchema },
    ]),
  ],
  providers: [UserSubscriptionService],
  controllers: [UserSubscriptionController],
})
export class UserSubscriptionModule {}
