import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { transactionModule } from './transaction.schema';
import mongoose, { Model } from 'mongoose';
import {
  createGroupTransactionDto,
  createTransactionDto,
  payOrderDto,
  transactionIdDto,
} from './transaction.dto';
import { authModule } from 'src/users/users.schema';
import { generateUniqueReceipt, transactionStatus } from 'utils/helper';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { categoryModule } from 'src/category/category.schema';
import { groupModule } from 'src/group/group.schema';
import { subscriptionModule } from 'src/subscription/subscription.schema';
import { userSubscriptionModule } from 'src/user-subscription/user-subscription.schema';
import { notificationModule } from 'src/notification/notification.schema';

@Injectable()
export class TransactionService {
  private razorpay: Razorpay;
  constructor(
    @InjectModel(transactionModule.name)
    private transactionModule: Model<transactionModule>,
    @InjectModel(authModule.name)
    private authModule: Model<authModule>,
    @InjectModel(categoryModule.name)
    private categoryModule: Model<categoryModule>,
    @InjectModel(groupModule.name)
    private groupModule: Model<groupModule>,
    @InjectModel(subscriptionModule.name)
    private subscriptionModule: Model<subscriptionModule>,
    @InjectModel(userSubscriptionModule.name)
    private userSubscriptionModule: Model<userSubscriptionModule>,
    @InjectModel(notificationModule.name)
    private notificationModule: Model<notificationModule>,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createTransaction(
    userId: string,
    transactionDto: createTransactionDto,
  ) {
    const user = await this.authModule.findById(userId);
    if (!user) {
      throw new NotAcceptableException(
        'User not found, please enter correct ID',
      );
    }

    const categories = transactionDto.categories ?? [];
    const groupData = transactionDto.group ?? null;

    const hasCategories = categories.length > 0;
    const hasGroup = !!groupData;

    if (!hasCategories && !hasGroup) {
      throw new BadRequestException(
        'Transaction must be associated with at least one category or group',
      );
    }

    let expectedAmount = 0;

    if (hasCategories) {
      const fetchedCategories = await this.categoryModule.find({
        _id: { $in: categories.map((c) => c.categoryId) },
      });

      if (fetchedCategories.length !== categories.length) {
        throw new BadRequestException(
          'One or more selected categories are invalid.',
        );
      }

      for (const selected of categories) {
        const category = fetchedCategories.find(
          (cat) => cat._id.toString() === selected.categoryId,
        );
        if (!category) continue;

        const plan = category.pricingPlans.find(
          (p) => p.duration === selected.duration,
        );
        if (!plan) {
          throw new BadRequestException(
            `Invalid duration ${selected.duration} for category ${category.name}`,
          );
        }

        expectedAmount += plan.price;
      }
    }

    if (hasGroup) {
      const fetchedGroup = await this.groupModule.findById(groupData.groupId);
      if (!fetchedGroup) {
        throw new BadRequestException('Selected group is invalid.');
      }

      const plan = fetchedGroup.pricePerStudent.find(
        (p) => p.duration === groupData.duration,
      );

      if (!plan) {
        throw new BadRequestException(
          `Invalid duration ${groupData.duration} for group ${fetchedGroup.title}`,
        );
      }

      expectedAmount += plan.price;
    }

    if (transactionDto.amount !== expectedAmount) {
      throw new BadRequestException(
        `Amount mismatch. Expected amount is ₹${expectedAmount}`,
      );
    }

    const transactionPayload: Record<string, any> = {
      user: userId,
      amount: transactionDto.amount,
      currency: transactionDto.currency,
      senderMode: transactionDto.senderMode,
      senderDetails: user,
      status: transactionStatus.PENDING,
      description: transactionDto.description,
    };

    if (hasCategories) transactionPayload.categories = categories;
    if (hasGroup) transactionPayload.group = groupData;

    const transaction = await this.transactionModule.create(transactionPayload);

    return {
      message: 'Transaction details added successfully',
      data: transaction,
      success: true,
    };
  }

  async createOrder(transactionId: transactionIdDto, userId: string) {
    const user = await this.authModule.findById(userId);

    if (!user) {
      throw new NotAcceptableException(
        'user not found, please enter correct ID',
      );
    }

    const receipt = generateUniqueReceipt();

    const transaction = await this.transactionModule.findById(
      transactionId.transactionId,
    );

    if (!transaction) {
      throw new NotAcceptableException(
        'Transaction not found, please enter correct ID',
      );
    }

    const options = {
      amount: transaction.amount * 100,
      currency: transaction.currency,
      receipt,
      payment_capture: 1,
      notes: {
        key1: transaction.description,
      },
    };

    try {
      const order = await this.razorpay.orders.create(options);

      if (order.status == 'created') {
        transaction.receipt = receipt;
        transaction.razorpay_order = order.id;
        transaction.status = transactionStatus.CREATED;
        transaction.orderCreatedAt = order.created_at;
        transaction.notes = order.notes ?? {};
        await transaction.save();
      }

      return {
        message: 'order created successfully',
        data: order,
        success: true,
      };
    } catch (err) {
      return {
        success: false,
        message: err.error.description,
        code: err.error.code,
      };
    }
  }

  async payOrder(payOrderDto: payOrderDto, userId: string) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      payOrderDto;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw new BadRequestException('Invalid signature from Razorpay');
    }

    const transaction = await this.transactionModule.findOne({
      razorpay_order: razorpay_order_id,
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const paymentDetails =
      await this.razorpay.payments.fetch(razorpay_payment_id);

    switch (paymentDetails.status) {
      case 'captured':
        transaction.status = transactionStatus.PAID;
        break;
      case 'failed':
        transaction.status = transactionStatus.FAILED;
        break;
      case 'refunded':
        transaction.status = transactionStatus.REFUND;
        break;
      case 'authorized':
        transaction.status = transactionStatus.AUTHORIZED;
        break;
      case 'created':
        transaction.status = transactionStatus.CREATED;
        break;
    }

    if (transaction.status === transactionStatus.PAID) {
      const startDate = new Date();

      if (transaction.categories && transaction.categories.length > 0) {
        for (const cat of transaction.categories) {
          const category = await this.categoryModule.findById(cat.categoryId);

          const existingSub = await this.userSubscriptionModule.findOne({
            user: transaction.user,
            categories: cat.categoryId,
            status: 'active',
          });

          if (existingSub) {
            existingSub.duration =
              (existingSub.duration || 0) + (cat.duration || 1);

            const currentEndDate = new Date(existingSub.endDate);
            currentEndDate.setMonth(
              currentEndDate.getMonth() + (cat.duration || 1),
            );
            existingSub.endDate = currentEndDate;

            await existingSub.save();
          } else {
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + (cat.duration || 1));

            await this.userSubscriptionModule.create({
              user: transaction.user,
              transaction: transaction._id,
              categories: [cat.categoryId],
              duration: cat.duration,
              startDate,
              endDate,
              status: 'active',
              priceAtPurchase: transaction.amount,
            });
          }

          if (category) {
            await this.notificationModule.create({
              userId,
              message: `✅ Your payment for "${category.name}" has been successfully processed.`,
              category: cat.categoryId,
              image: category.logo,
              type: 'Payment successful',
            });
          }
        }
      }

      if (transaction.group) {
        const groupData = transaction.group as {
          groupId: mongoose.Types.ObjectId;
          duration: number;
        };

        const group = await this.groupModule.findById(groupData.groupId);

        const existingSub = await this.userSubscriptionModule.findOne({
          user: transaction.user,
          group: groupData.groupId,
          status: 'active',
        });

        if (existingSub) {
          existingSub.duration =
            (existingSub.duration || 0) + (groupData.duration || 1);

          const currentEndDate = new Date(existingSub.endDate);
          currentEndDate.setMonth(
            currentEndDate.getMonth() + (groupData.duration || 1),
          );
          existingSub.endDate = currentEndDate;

          await existingSub.save();
        } else {
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + (groupData.duration || 1));

          await this.userSubscriptionModule.create({
            user: transaction.user,
            transaction: transaction._id,
            group: groupData.groupId,
            duration: groupData.duration,
            startDate,
            endDate,
            status: 'active',
            priceAtPurchase: transaction.amount,
          });
        }

        if (group) {
          await this.notificationModule.create({
            userId,
            groupId: groupData.groupId,
            message: `✅ Your payment for "${group.title}" has been successfully processed.`,
            image: group.logo,
          });
        }
      }
    }

    transaction.razorpay_payment_id = razorpay_payment_id;

    transaction.mode = paymentDetails.method;
    transaction.razorpay_signature = razorpay_signature;
    transaction.paymentVerifiedAt = new Date();
    await transaction.save();

    return {
      message: 'Payment verified successfully',
      success: true,
    };
  }

  async fetchUserTransactions(userId: string) {
    const transaction = await this.transactionModule
      .find({ user: userId })
      .sort({ createdAt: -1 });

    return {
      message: 'All users transactions fetched successfully',
      data: transaction,
      success: true,
    };
  }

  async fetchUserTransactionsbyAdmin() {
    const transaction = await this.transactionModule.find();

    return {
      message: 'All users transactions fetched successfully',
      data: transaction,
      success: true,
    };
  }

  async createGroupTransaction(dto: createGroupTransactionDto) {
    const group = await this.groupModule.findById(dto.groupId);

    if (!group) {
      throw new BadRequestException('Group not found');
    }

    if (!group.members || group.members.length === 0) {
      throw new BadRequestException(`Group ${group.title} has no members.`);
    }

    let expectedAmount = 0;
    for (const u of dto.users) {
      const isMember = group.members.some(
        (m) => m.user.toString() === u.userId.toString(),
      );

      if (!isMember) {
        throw new BadRequestException(
          `User ${u.userId} is not a member of group ${group.title}`,
        );
      }

      const plan = group.pricePerStudent.find((p) => p.duration === u.duration);
      if (!plan) {
        throw new BadRequestException(
          `Invalid duration ${u.duration} for group ${group.title}`,
        );
      }
      expectedAmount += plan.price;
    }

    if (dto.amount !== expectedAmount) {
      throw new BadRequestException(
        `Amount mismatch. Expected ₹${expectedAmount}`,
      );
    }

    const transaction = await this.transactionModule.create({
      group: { groupId: dto.groupId },
      groupUsers: dto.users,
      amount: dto.amount,
      currency: dto.currency,
      senderMode: dto.senderMode,
      status: transactionStatus.PENDING,
      description: dto.description,
    });

    return {
      message: 'Group transaction created successfully',
      data: transaction,
      success: true,
    };
  }

  async payOrderWebsite(payOrderDto: payOrderDto, userId: string) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      payOrderDto;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw new BadRequestException('Invalid signature from Razorpay');
    }

    const transaction = await this.transactionModule.findOne({
      razorpay_order: razorpay_order_id,
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status === transactionStatus.PAID) {
      return { message: 'Payment already processed', success: true };
    }

    const paymentDetails =
      await this.razorpay.payments.fetch(razorpay_payment_id);

    switch (paymentDetails.status) {
      case 'captured':
        transaction.status = transactionStatus.PAID;
        break;
      case 'failed':
        transaction.status = transactionStatus.FAILED;
        break;
      case 'refunded':
        transaction.status = transactionStatus.REFUND;
        break;
      case 'authorized':
        transaction.status = transactionStatus.AUTHORIZED;
        break;
      case 'created':
        transaction.status = transactionStatus.CREATED;
        break;
    }

    if (transaction.status === transactionStatus.PAID) {
      const startDate = new Date();

      if (transaction.group && transaction.groupUsers?.length > 0) {
        const group = await this.groupModule.findById(
          transaction.group.groupId,
        );

        for (const u of transaction.groupUsers) {
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + (u.duration || 1));

          // const alreadyApplied = await this.userSubscriptionModule.findOne({
          //   user: u.userId,
          //   group: transaction.group.groupId,
          //   appliedPaymentId: razorpay_payment_id,
          // });

          // if (alreadyApplied) continue;

          const existingSub = await this.userSubscriptionModule.findOne({
            user: u.userId,
            group: transaction.group.groupId,
            status: 'active',
          });

          if (existingSub) {
            existingSub.duration =
              (existingSub.duration || 0) + (u.duration || 1);

            const currentEndDate = new Date(existingSub.endDate);
            currentEndDate.setMonth(
              currentEndDate.getMonth() + (u.duration || 1),
            );
            existingSub.endDate = currentEndDate;
            // existingSub.appliedPaymentId = razorpay_payment_id;

            await existingSub.save();
          } else {
            await this.userSubscriptionModule.create({
              user: u.userId,
              transaction: transaction._id,
              group: transaction.group.groupId,
              duration: u.duration,
              startDate,
              endDate,
              status: 'active',
              priceAtPurchase: transaction.amount,
              // appliedPaymentId: razorpay_payment_id,
            });
          }

          if (group) {
            await this.notificationModule.create({
              userId: u.userId,
              groupId: transaction.group.groupId,
              message: `✅ Your payment for "${group.title}" has been successfully processed.`,
              image: group.logo,
              type: 'Group Payment',
            });
          }
        }
      }
    }

    transaction.razorpay_payment_id = razorpay_payment_id;

    transaction.mode = paymentDetails.method;
    transaction.razorpay_signature = razorpay_signature;
    transaction.paymentVerifiedAt = new Date();
    await transaction.save();

    return {
      message: 'Payment verified successfully',
      success: true,
    };
  }
}
