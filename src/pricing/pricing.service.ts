import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { pricingPlansModule } from './pricing.schema';
import { Model } from 'mongoose';
import { createPricingPlansDto } from './pricing.dto';
import { authModule } from 'src/users/users.schema';

@Injectable()
export class PricingService {
  constructor(
    @InjectModel(pricingPlansModule.name)
    private pricingModule: Model<pricingPlansModule>,
    @InjectModel(authModule.name) private authModule: Model<authModule>,
  ) {}

  async addPricingPlans(
    createPricingPlansDto: createPricingPlansDto,
    userId: string,
  ) {
    const user = await this.authModule.findById(userId);

    if (!user) {
      throw new NotAcceptableException('user not found');
    }

    const { type, plans } = createPricingPlansDto;

    let doc = await this.pricingModule.findOne({ type });

    if (!doc) {
      doc = await this.pricingModule.create({
        type,
        plans,
        updatedBy: user._id,
      });

      return {
        message: 'plans added successfully',
        success: true,
        data: doc,
      };
    }

    plans.forEach((newPlan) => {
      const index = doc!.plans.findIndex(
        (p) => p.duration === newPlan.duration,
      );
      if (index >= 0) {
        doc!.plans[index].price = newPlan.price;
      } else {
        doc!.plans.push(newPlan);
      }
    });

    doc.updatedBy = user._id;
    await doc.save();

    return {
      message: 'plans updated successfully',
      success: true,
      data: doc,
    };
  }

  async fetchAll() {
    return {
      message: 'All pricing plans fetched successfully',
      data: await this.pricingModule
        .find()
        .populate('updatedBy', '_id Name profilePicture role'),
      success: true,
    };
  }

  async fetchGroupPricing() {
    return {
      message: 'Group pricing plans fetched successfully',
      data: await this.pricingModule.find({ type: 'group' }),
      success: true,
    };
  }
}
