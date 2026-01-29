import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { userSubscriptionModule } from './user-subscription.schema';
import mongoose, { Model } from 'mongoose';
import { groupModule } from 'src/group/group.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

interface GroupSubscriptionResponse {
  _id: mongoose.Types.ObjectId;
  group: any;
  duration: number;
  startDate: Date;
  endDate: Date;
  status: string;
}

interface CategorySubscriptionResponse {
  _id: mongoose.Types.ObjectId;
  category: any;
  duration: number;
  startDate: Date;
  endDate: Date;
  status: string;
}

@Injectable()
export class UserSubscriptionService {
  constructor(
    @InjectModel(userSubscriptionModule.name)
    private userSubscriptionModule: Model<userSubscriptionModule>,
    @InjectModel(groupModule.name)
    private groupModule: Model<groupModule>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireSubscriptions() {
    await this.userSubscriptionModule.updateMany(
      { endDate: { $lt: new Date() }, status: 'active' },
      { $set: { status: 'expired' } },
    );
    console.log('✅ Expired subscriptions updated');
  }

  async isUserPaidForGroup(groupId: string, userId: string): Promise<boolean> {
    const today = new Date();

    const subscription = await this.userSubscriptionModule.findOne({
      user: userId,
      group: groupId,
      status: 'active',
      startDate: { $lte: today },
      endDate: { $gte: today },
    });

    return !!subscription;
  }

  async fetchSubscribedUsersOfGroup(groupId: string, adminId: string) {
    const group = await this.groupModule.findById(groupId);

    if (!group) {
      throw new NotFoundException('Group not found, please enter correct ID');
    }

    if (group.admin.toString() != adminId) {
      throw new BadRequestException(
        'only group admins can fetch subscribed users',
      );
    }

    const subscription = await this.userSubscriptionModule
      .find({
        group: groupId,
      })
      .populate('user', 'Name phoneNumber profilePicture');

    return {
      message: 'Subscribed users fetched successfully',
      data: subscription,
      success: true,
    };
  }

  // async fetchAllUserSubscriptions(userId: string) {
  //   const subscription = await this.userSubscriptionModule
  //     .find({ user: userId, status: 'active' })
  //     .populate('categories', 'name description logo _id')
  //     .populate('group', 'title description logo _id')
  //     .select('-transaction -priceAtPurchase')
  //     .lean();

  //   const result = {
  //     groupsSubscriptions: [],
  //     categorySubscriptions: [],
  //   };

  //   subscription.forEach((sub) => {
  //     if (sub.group) {
  //       result.groupsSubscriptions.push({
  //         _id: sub._id,
  //         group: sub.group,
  //         duration: sub.duration,
  //         startDate: sub.startDate,
  //         endDate: sub.endDate,
  //         status: sub.status,
  //       });
  //     }

  //     if (sub.categories && sub.categories.length > 0) {
  //       sub.categories.forEach((cat) => {
  //         result.categorySubscriptions.push({
  //           _id: sub._id,
  //           category: cat,
  //           duration: sub.duration,
  //           startDate: sub.startDate,
  //           endDate: sub.endDate,
  //           status: sub.status,
  //         });
  //       });
  //     }
  //   });

  //   return {
  //     message: 'User subscription',
  //     data: result,
  //     success: true,
  //   };
  // }

  async fetchAllUserSubscriptions(userId: string) {
    const subscriptions = await this.userSubscriptionModule
      .find({ user: userId, status: 'active' })
      .populate('categories', 'name description logo _id')
      .populate('group', 'title description logo _id')
      .select('-transaction -priceAtPurchase')
      .lean();

    const result: {
      groupsSubscriptions: GroupSubscriptionResponse[];
      categorySubscriptions: CategorySubscriptionResponse[];
    } = {
      groupsSubscriptions: [],
      categorySubscriptions: [],
    };

    subscriptions.forEach((sub) => {
      if (sub.group) {
        result.groupsSubscriptions.push({
          _id: sub._id,
          group: sub.group,
          duration: sub.duration,
          startDate: sub.startDate,
          endDate: sub.endDate,
          status: sub.status,
        });
      }

      if (sub.categories && sub.categories.length > 0) {
        sub.categories.forEach((cat) => {
          result.categorySubscriptions.push({
            _id: sub._id,
            category: cat,
            duration: sub.duration,
            startDate: sub.startDate,
            endDate: sub.endDate,
            status: sub.status,
          });
        });
      }
    });

    return {
      message: 'User subscription',
      data: result,
      success: true,
    };
  }
}
