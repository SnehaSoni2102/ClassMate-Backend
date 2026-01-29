import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { subscriptionModule } from './subscription.schema';
import { Model } from 'mongoose';
import { addSubscriptionDto } from './subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(subscriptionModule.name)
    private subscriptionModule: Model<subscriptionModule>,
  ) {}

  async createSubscription(addSubscriptionDto: addSubscriptionDto) {
    const subscription =
      await this.subscriptionModule.create(addSubscriptionDto);

    return {
      message: 'subscription added successfully',
      data: subscription,
      success: true,
    };
  }

  async fetchAllSubscriptions() {
    return {
      message: 'All subscription plans fetched successfully',
      data: await this.subscriptionModule.find(),
      success: true,
    };
  }
}
