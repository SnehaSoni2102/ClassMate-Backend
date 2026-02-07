import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { categoryModule } from './category.schema';
import { testModule } from 'src/test/test.schema';
import mongoose, { Model } from 'mongoose';
import {
  addCategoryDto,
  fetchCategoryDto,
  getCategoryPriceDto,
  updateCategoryDto,
  updatePriceDto,
} from './category.dto';
import { S3UploadService } from 'utils/s3Uploader';
import { examModule } from 'src/exam/exam.schema';
import { CategoryModule } from './category.module';
import { pricingPlansModule } from 'src/pricing/pricing.schema';
import { authModule } from 'src/users/users.schema';
import { notificationModule } from 'src/notification/notification.schema';
import { userSubscriptionModule } from 'src/user-subscription/user-subscription.schema';

export interface CategoryTree extends CategoryModule {
  _id: any;
  exams: any[];
  hasSubscription: boolean;
  children?: CategoryTree[];
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(categoryModule.name)
    private categoryModule: Model<categoryModule>,
    @InjectModel(examModule.name) private examModule: Model<examModule>,
    @InjectModel(testModule.name) private testModule: Model<testModule>,
    @InjectModel(pricingPlansModule.name)
    private pricingModule: Model<pricingPlansModule>,
    private s3UploadService: S3UploadService,
    @InjectModel(authModule.name)
    private authModule: Model<authModule>,
    @InjectModel(notificationModule.name)
    private notificationModule: Model<notificationModule>,
    @InjectModel(userSubscriptionModule.name)
    private userSubscriptionModule: Model<userSubscriptionModule>,
  ) {}

  async addCategory(
    addCategoryDto: addCategoryDto,
    file?: Express.Multer.File,
  ) {
    if (file) {
      const imageUrl = await this.s3UploadService.uploadFile(file, 'logo');
      addCategoryDto.logo = imageUrl;
    }

    if (
      addCategoryDto.parent &&
      !mongoose.Types.ObjectId.isValid(addCategoryDto.parent)
    ) {
      throw new Error('Invalid parent category ID');
    }

    const categoryData: any = {
      ...addCategoryDto,
      parent: addCategoryDto.parent || null,
    };

    if (!addCategoryDto.parent) {
      const pricing = await this.pricingModule.findOne({ type: 'category' });
      categoryData.pricingPlans = pricing?.plans || [];
    }

    const category = await this.categoryModule.create(categoryData);

    const allUsers = await this.authModule.find({});

    await Promise.all(
      allUsers.map((user) =>
        this.notificationModule.create({
          userId: user._id,
          message: `🆕 A new category "${category.name}" has just been added. Explore now and see what's inside!`,
          categoryId: category._id,
          image: category.logo,
          type: 'New Category Alert',
        }),
      ),
    );

    return {
      message: 'category added successfully',
      data: category,
      success: true,
    };
  }

  async fetchCategories(fetchCategoryDto: fetchCategoryDto) {
    const { name } = fetchCategoryDto;
    let categories;

    if (name) {
      categories = await this.categoryModule
        .find({ name: { $regex: new RegExp(name, 'i') } })
        .populate('exams');
    } else {
      categories = await this.categoryModule.find().populate('exams');
    }

    return {
      message: 'Categories fetched successfully',
      data: categories,
      success: true,
    };
  }

  async fetchOneCategory(id: string) {
    const category = await this.categoryModule
      .findById(id)
      .populate('exams')
      .exec();

    return {
      message: 'Category fetched successfully',
      data: category,
      success: true,
    };
  }

  async searchCategoriesAndExams(query: string, questionCount: boolean) {
    const regex = new RegExp(query, 'i');

    const categories = await this.categoryModule.find().populate({
      path: 'exams',
      match: { name: regex },
      select: 'name logo',
    });

    const result = categories
      .map((category) => {
        const matchInCategoryName = regex.test(category.name);
        const matchingExams = category.exams || [];

        if (matchInCategoryName || matchingExams.length > 0) {
          return {
            _id: category._id,
            name: category.name,
            logo: category.logo,
            exams: matchingExams,
          };
        }
        return null;
      })
      .filter(Boolean);

    const response: any = {
      message: 'Exams and categories fetched successfully',
      data: result,
      success: true,
    };

    if (questionCount) {
      response.total = result.length;
    }

    return response;
  }

  async fetchAllCategories() {
    return {
      message: 'Categories fetched successfully',
      data: await this.categoryModule.find(),
      success: true,
    };
  }

  async getCategories(lang: 'en' | 'hi' = 'en') {
    const categories = await this.categoryModule.find().lean();

    const formatted = categories.map((cat) => ({
      id: cat._id,
      name: lang === 'hi' ? cat.name_hi : cat.name,
    }));

    return {
      message: 'Categories fetched successfully',
      data: formatted,
      success: true,
    };
  }

  async getExamsByCategory(categoryName: string, lang: 'en' | 'hi' = 'en') {
    const regex = new RegExp(`^${categoryName}$`, 'i');

    const category = await this.categoryModule
      .findOne({
        $or: [{ name: regex }, { name_hi: regex }],
      })
      .populate('exams')
      .lean();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const exams = (category.exams || []).map((exam: any) => ({
      id: exam._id,
      name: lang === 'hi' ? exam.name_hi : exam.name,
    }));

    return {
      message: 'Exams fetched successfully',
      data: exams,
      success: true,
    };
  }

  async updateCategory(
    id: string,
    updateDto: updateCategoryDto,
    file?: Express.Multer.File,
  ) {
    const category = await this.categoryModule.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (file) {
      const imageUrl = await this.s3UploadService.uploadFile(file, 'logo');
      updateDto.logo = imageUrl;
    }

    const updated = await this.categoryModule.findByIdAndUpdate(id, updateDto, {
      new: true,
    });

    return {
      message: 'Category updated successfully',
      data: updated,
      success: true,
    };
  }

  async deleteCategory(id: string) {
    const category = await this.categoryModule.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.examModule.deleteMany({ _id: { $in: category.exams } });

    await this.categoryModule.findByIdAndDelete(id);

    return {
      message: 'Category and its associated exams deleted successfully',
      success: true,
    };
  }

  async getCategoryTree(categoryId: string, userId?: string) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new Error('Invalid Category ID');
    }

    const root = (await this.categoryModule
      .findById(categoryId)
      .lean()
      .populate('exams')) as unknown as CategoryTree;

    if (!root) {
      throw new Error('Category not found');
    }

    const buildTree = async (
      category: CategoryTree,
    ): Promise<CategoryTree[]> => {
      const children = (await this.categoryModule
        .find({ parent: category._id })
        .lean()
        .populate('exams')) as unknown as CategoryTree[];

      for (const child of children) {
        child.children = await buildTree(child);
      }

      return children;
    };

    root.children = await buildTree(root);

    root.hasSubscription = false;

    if (userId) {
      const activeSubscription = await this.userSubscriptionModule.find({
        user: userId,
        categories: { $in: [new mongoose.Types.ObjectId(categoryId)] },
        status: 'active',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });

      if (activeSubscription.length > 0) {
        root.hasSubscription = true;
      }
    }
    // For each node in the tree (root + descendants), fetch tests for each exam
    const traverseAndAttachTests = async (node: CategoryTree) => {
      if (Array.isArray(node.exams) && node.exams.length > 0) {
        for (const exam of node.exams as any[]) {
          try {
            const tests = await this.testModule.find({ exam: exam._id }).lean();
            (exam as any).tests = tests;
          } catch (err) {
            (exam as any).tests = [];
          }
        }
      }
      if (Array.isArray(node.children) && node.children.length > 0) {
        for (const child of node.children) {
          await traverseAndAttachTests(child);
        }
      }
    };

    await traverseAndAttachTests(root);

    // console.log(root);

    return {
      message: 'Categories fetched successfully',
      data: root,
      success: true,
    };
  }

  async getTopLevelCategories() {
    const categories = await this.categoryModule.find({ parent: null }).exec();

    return {
      success: true,
      message: 'Top-level categories fetched successfully',
      data: categories,
    };
  }

  async updatePrice(id: string, categoryDto: updatePriceDto) {
    const category = await this.categoryModule.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.parent !== null) {
      throw new Error('Price can only be updated for top-level categories');
    }

    const updatedCategory = await this.categoryModule.findByIdAndUpdate(
      id,
      categoryDto,
      { new: true },
    );

    return {
      message: 'Category price updated successfully',
      data: updatedCategory,
      success: true,
    };
  }

  async updateAllCategoryPrices(priceDto: updatePriceDto) {
    const updatedCategories = await this.categoryModule.updateMany(
      { parent: null },
      { pricingPlans: priceDto.pricingPlans },
    );

    return {
      message: 'All top-level category prices updated successfully',
      data: updatedCategories,
      success: true,
    };
  }

  async getCategoryPrices(dto: getCategoryPriceDto) {
    const { categoryIds, duration } = dto;

    const categories = await this.categoryModule.find({
      _id: { $in: categoryIds },
    });

    const results = categories.map((cat) => {
      const plan = cat.pricingPlans.find((p) => p.duration === duration);

      return {
        categoryId: cat._id,
        categoryName: cat.name,
        duration,
        price: plan ? plan.price : null,
      };
    });

    return {
      message: 'Subscription plans fetched successfully',
      data: results,
      success: true,
    };
  }
}
