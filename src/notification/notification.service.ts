import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { notificationModule } from './notification.schema';
import mongoose, { Model, Types } from 'mongoose';
import { authModule } from 'src/users/users.schema';
import { markAsReadDto } from './notification.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { testModule } from 'src/test/test.schema';
import { userSubscriptionModule } from 'src/user-subscription/user-subscription.schema';
import { groupModule } from 'src/group/group.schema';
import { categoryModule } from 'src/category/category.schema';
import { freeTrialModule } from 'src/users/freeTrail.schema';

type PopulatedSubscription = userSubscriptionModule & {
  group?: groupModule;
  categories?: categoryModule[];
};

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(notificationModule.name)
    private notificationModule: Model<notificationModule>,
    @InjectModel(authModule.name)
    private authModule: Model<authModule>,
    @InjectModel(groupModule.name)
    private groupModule: Model<groupModule>,
    @InjectModel(testModule.name)
    private testModule: Model<testModule>,
    @InjectModel(userSubscriptionModule.name)
    private userSubscriptionModule: Model<userSubscriptionModule>,
    @InjectModel(freeTrialModule.name)
    private freeTrialModule: Model<freeTrialModule>,
  ) {}

  async fetchNotification(userId: string) {
    const notification = await this.notificationModule
      .find({
        userId: new mongoose.Types.ObjectId(userId),
      })
      .sort({ createdAt: -1 });

    return {
      message: 'Notifications fetched successfully',
      data: notification,
      success: true,
    };
  }

  async markAsRead(userId: string, dto: markAsReadDto) {
    const notification = await this.notificationModule.findOne({
      userId,
      _id: dto.notificationId,
    });

    if (!notification) {
      throw new NotFoundException('notification not found.');
    }

    notification.isRead = true;
    await notification.save();

    return {
      message: 'Notification marked as read successfully',
      success: true,
    };
  }

  async markAllAsRead(userId: Types.ObjectId | string) {
    const id = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const result = await this.notificationModule.updateMany(
      { userId: id, isRead: false },
      { $set: { isRead: true } },
    );

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<{ message: string; success: boolean }> {
    const notif = await this.notificationModule.findOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });

    if (!notif) {
      throw new NotFoundException('Notification not found');
    }

    // If user deletes a pending Group Invitation, allow re-invite:
    // Remove from group's invitedUsers and user's invitedGroups
    if (
      notif.type === 'Group Invitation' &&
      notif.groupId &&
      (notif.invitationStatus === 'pending' || !notif.invitationStatus)
    ) {
      await this.groupModule.updateOne(
        { _id: notif.groupId },
        { $pull: { invitedUsers: notif.userId } },
      );
      await this.authModule.updateOne(
        { _id: notif.userId },
        { $pull: { invitedGroups: notif.groupId } },
      );
    }

    // If admin deletes a pending Group Join Request notification,
    // remove the join request from group and clear user's requestedToJoinGroups
    if (
      notif.type === 'Group Join Request' &&
      notif.groupId &&
      notif.requestedUserId &&
      (notif.invitationStatus === 'pending' || !notif.invitationStatus)
    ) {
      await this.groupModule.updateOne(
        { _id: notif.groupId },
        { $pull: { joinRequests: notif.requestedUserId } },
      );
      await this.authModule.updateOne(
        { _id: notif.requestedUserId },
        { $pull: { requestedToJoinGroups: notif.groupId } },
      );
    }

    await this.notificationModule.deleteOne({ _id: notif._id });

    return {
      message: 'Notification deleted successfully',
      success: true,
    };
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async sendTestNotifications() {
    const now = new Date();

    const tests = await this.testModule.find({
      startDate: { $gte: now },
    });

    for (const test of tests) {
      const start = new Date(`${test.startDate}T${test.startTime}:00Z`);
      const end = new Date(`${test.endDate}T${test.endTime}:00Z`);

      const oneWeekBefore = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayBefore = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      const oneHourBefore = new Date(start.getTime() - 60 * 60 * 1000);
      const tenMinutesBefore = new Date(start.getTime() - 10 * 60 * 1000);

      let message: string | null = null;

      if (now >= oneWeekBefore && now < oneDayBefore) {
        message = `📝 Plan ahead! Test ${test.title} will begin on ${test.startDate}, don’t miss it.`;
      } else if (now >= oneDayBefore && now < oneHourBefore) {
        message = `⏳ Only 1 day left! The test ${test.title} starts tomorrow at ${test.startTime}.`;
      } else if (now >= oneHourBefore && now < tenMinutesBefore) {
        message = `⏰ Countdown: Test ${test.title} begins in 1 hour. Finalize your prep!`;
      } else if (now >= tenMinutesBefore && now < start) {
        message = `🔥 Final call! Test ${test.title} is about to start in 10 mins.`;
      } else if (now >= start && now < end) {
        message = `🎯 It's time! Test ${test.title} has started. Best of luck 🍀.`;
      } else if (now >= end) {
        message = `📊 Test ${test.title} is completed. Stay tuned for results.`;
      }

      if (message) {
        await this.notifyAllUsers(message);
      }
    }
  }

  private async notifyAllUsers(message: string) {
    const users = await this.authModule.find();

    for (const user of users) {
      const alreadySent = await this.notificationModule.findOne({
        userId: user._id,
        message,
        sent: true,
      });

      if (!alreadySent) {
        await this.notificationModule.create({
          userId: user._id,
          message,
          type: 'test update',
          sent: true,
        });
      }
      console.log(`📩 Notify ${user.email}: ${message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async sendSubscriptionExpiryNotifications() {
    const now = new Date();

    const subscriptions = await this.userSubscriptionModule
      .find({
        status: 'active',
      })
      .populate('user')
      .populate('categories', 'name')
      .populate('group', 'title');

    for (const sub of subscriptions) {
      const endDate = new Date(sub.endDate);
      const timeDiff = endDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      const subPop = sub as PopulatedSubscription;

      let targetName = '';
      if (sub.group) {
        targetName = `group "${subPop.group?.title}"`;
      } else if (sub.categories && sub.categories.length > 0) {
        const names = sub.categories.map((cat: any) => cat.name).join(', ');
        targetName = `category subscription(s): ${names}`;
      } else {
        targetName = 'your subscription';
      }

      let message: string | null = null;

      if (daysLeft === 2) {
        message = `⚠️ Reminder: Your subscription for ${targetName} will expire in 2 days (on ${endDate.toDateString()}).`;
      } else if (daysLeft === 1) {
        message = `⏳ Last chance! Your subscription for ${targetName} expires tomorrow (${endDate.toDateString()}).`;
      } else if (daysLeft <= 0) {
        message = `❌ Your subscription for ${targetName} expired on ${endDate.toDateString()}. Please renew to continue.`;

        sub.status = 'expired';
        await sub.save();
      }

      if (message) {
        await this.notifyUser(sub.user._id, message);
      }

      const freeTrial = await this.freeTrialModule.findOne({ isActive: true });

      if (freeTrial) {
        const users = await this.authModule.find({ role: 'student' });

        for (const user of users) {
          const trialEndDate = new Date((user as any).createdAt);
          trialEndDate.setDate(trialEndDate.getDate() + freeTrial.days);

          if (new Date() >= trialEndDate) {
            if (user.hasFreeTrial) {
              user.hasFreeTrial = false;
              await user.save();

              await this.notifyUser(
                user._id,
                `❌ Your free trial expired on ${trialEndDate.toDateString()}. Please subscribe to continue.`,
              );
            }
          } else {
            if (!user.hasFreeTrial) {
              user.hasFreeTrial = true;
              await user.save();
            }
          }
        }
      }
    }
  }

  private async notifyUser(userId: Types.ObjectId, message: string) {
    const alreadySent = await this.notificationModule.findOne({
      userId,
      message,
      sent: true,
    });

    if (!alreadySent) {
      await this.notificationModule.create({
        userId,
        message,
        type: 'subscription update',
        sent: true,
      });
    }

    console.log(`📩 Notify user ${userId}: ${message}`);
  }
}
