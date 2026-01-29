import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { subscriptionModule, subscriptionSchema } from './subscription.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: subscriptionModule.name, schema: subscriptionSchema },
    ]),
  ],
  providers: [SubscriptionService, JwtStrategy],
  controllers: [SubscriptionController],
})
export class SubscriptionModule {}
