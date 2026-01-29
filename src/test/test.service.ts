import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { testModule } from './test.schema';
import mongoose, { Model } from 'mongoose';
import { authModule } from 'src/users/users.schema';
import {
  createTestDto,
  createTestDtoAllIndia,
  updateStatusDto,
  updateTestDto,
} from './test.dto';
import { sectionModule } from 'src/section/section.schema';
import { questionModule } from 'src/question/question.schema';
import { examModule } from 'src/exam/exam.schema';
import { categoryModule } from 'src/category/category.schema';
import { userSubscriptionModule } from 'src/user-subscription/user-subscription.schema';
import { notificationModule } from 'src/notification/notification.schema';
import { bannerModule } from 'src/banner/banner.schema';
import { userTestAttemptModule } from 'src/user-test-attempt/user-test-attempt.schema';
import { freeTrialModule } from 'src/users/freeTrail.schema';

@Injectable()
export class TestService {
  constructor(
    @InjectModel(testModule.name) private testModule: Model<testModule>,
    @InjectModel(authModule.name) private authModule: Model<authModule>,
    @InjectModel(sectionModule.name)
    private sectionModule: Model<sectionModule>,
    @InjectModel(questionModule.name)
    private questionModule: Model<questionModule>,
    @InjectModel(examModule.name)
    private examModule: Model<examModule>,
    @InjectModel(categoryModule.name)
    private categoryModule: Model<categoryModule>,
    @InjectModel(userSubscriptionModule.name)
    private userSubscriptionModule: Model<userSubscriptionModule>,
    @InjectModel(notificationModule.name)
    private notificationModule: Model<notificationModule>,
    @InjectModel(bannerModule.name)
    private bannerModule: Model<bannerModule>,
    @InjectModel(userTestAttemptModule.name)
    private userTestAttemptModule: Model<userTestAttemptModule>,
    @InjectModel(freeTrialModule.name)
    private freeTrialModule: Model<freeTrialModule>,
  ) {}

  async createTest(id: string, createTestDto: createTestDto) {
    const user = await this.authModule.findById(id);

    if (!user) {
      throw new NotFoundException('user not found!, Please signup.');
    }

    if (createTestDto.type === 'live') {
      if (
        !createTestDto.startDate ||
        !createTestDto.startTime ||
        !createTestDto.endDate ||
        !createTestDto.endTime
      ) {
        throw new BadRequestException(
          'startDate, startTime, endDate, and endTime are required for test type "live".',
        );
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(createTestDto.startDate);
    const end = new Date(createTestDto.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start < today || end < today) {
      throw new BadRequestException(
        'startDate and endDate cannot be in the past.',
      );
    }

    if (end < start) {
      throw new BadRequestException(
        'endDate cannot be earlier than startDate.',
      );
    }

    const durationInSeconds = createTestDto.durationInMinutes * 60;

    const sections: { id: mongoose.Types.ObjectId; questions: string[] }[] = [];

    for (const section of createTestDto.sections) {
      const validQuestions = await this.questionModule.find({
        _id: { $in: section.questionIds },
      });

      if (validQuestions.length !== section.questionIds.length) {
        throw new BadRequestException('One or more questionIds are invalid');
      }

      const createdSection = await this.sectionModule.create({
        user: user._id,
        name: section.name,
        name_hi: section.name_hi,
        order: section.order,
        timeLimit: section.timeLimit,
        questions: section.questionIds,
      });

      sections.push({ id: createdSection._id, questions: section.questionIds });
    }

    const exam = await this.examModule.findById(createTestDto.exam);

    if (!exam) {
      throw new NotFoundException('exam not found.');
    }

    const test = await this.testModule.create({
      user: user._id,
      title: createTestDto.title,
      title_hi: createTestDto.title_hi,
      totalQuestions: sections.reduce(
        (acc, curr) => acc + curr.questions.length,
        0,
      ),
      totalSections: createTestDto.totalSections,
      durationInMinutes: durationInSeconds,
      totalMarks: createTestDto.totalMarks,
      marksPerQuestion: createTestDto.marksPerQuestion,
      negativeMarks: createTestDto.negativeMarks,
      description: createTestDto.description,
      description_hi: createTestDto.description_hi,
      languageOptions: createTestDto.languageOptions,
      type: createTestDto.type,
      startDate: createTestDto.startDate,
      startTime: createTestDto.startTime,
      endDate: createTestDto.endDate,
      endTime: createTestDto.endTime,
      sections: sections.map((s) => s.id),
      exam: createTestDto.exam,
      testType: createTestDto.testType,
    });

    const allUsers = await this.authModule.find({});
    await Promise.all(
      allUsers.map((u) =>
        this.notificationModule.create({
          userId: u._id,
          message: `📝 A new test "${test.title}" has just been published! Check it out and challenge yourself.`,
          testId: test._id,
          type: 'New Test Alert',
        }),
      ),
    );

    return {
      message: 'test created successfully',
      data: test,
    };
  }

  async fetchAllTests(userId?: string) {
    let tests;

    const filterCondition: any = { status: 'published' };

    if (userId) {
      const user = await this.authModule
        .findById(userId)
        .select('submittedTests');

      const submittedTestIds = user?.submittedTests ?? [];
      filterCondition._id = { $nin: submittedTestIds };
    }

    tests = await this.testModule
      .find(filterCondition)
      .populate(['sections', 'exam'])
      .exec();

    const categorizedTests: Record<string, any[]> = {};

    for (const test of tests) {
      const examName = test.exam?.name || 'Uncategorized';

      if (!categorizedTests[examName]) {
        categorizedTests[examName] = [];
      }

      categorizedTests[examName].push(test);
    }

    return {
      message: 'Tests fetched successfully',
      data: categorizedTests,
      success: true,
    };
  }

  async findOneTest(id: string) {
    const test = await this.testModule
      .findById(id)
      .populate({
        path: 'sections',
        populate: {
          path: 'questions',
          model: 'questionModule',
        },
      })
      .populate('exam')
      .exec();

    if (!test) {
      throw new NotFoundException('test not found');
    }

    const transformedTest = {
      _id: test._id,
      title: test.title,
      title_hi: test.title_hi,
      totalQuestions: test.totalQuestions,
      totalSections: test.totalSections,
      durationInMinutes: test.durationInMinutes,
      totalMarks: test.totalMarks,
      marksPerQuestion: test.marksPerQuestion,
      negativeMarks: test.negativeMarks,
      description: test.description,
      description_hi: test.description_hi,
      languageOptions: test.languageOptions,
      type: test.type,
      status: test.status,
      startDate: test.startDate,
      startTime: test.startTime,
      endDate: test.endDate,
      endTime: test.endTime,
      exam: test.exam,
      sections: test.sections.map((section: any) => ({
        _id: section._id,
        name: section.name,
        name_hi: section.name_hi,
        order: section.order,
        timeLimit: section.timeLimit,
        questions: section.questions.map((q: any) => ({
          _id: q._id,
          serial_no: q.serial_no,
          image: q.image,
          question: q.text,
          question_hi: q.text_hi,
          options: q.options,
          options_hi: q.options_hi,
          correctAnswers: q.correctAnswers,
          correctAnswers_hi: q.correctAnswers_hi,
          positiveMarking: q.marks,
          negativeMarking: q.negativeMarks,
          multipleSelection: q.isTwoOptions,
        })),
      })),
    };

    return {
      message: 'test fetched successfully',
      data: transformedTest,
      success: true,
    };
  }

  async updateTest(id: string, testId: string, updateTestDto: updateTestDto) {
    const user = await this.authModule.findById(id);

    if (!user) {
      throw new NotFoundException('user not found, please sign up.');
    }

    const test = await this.testModule.findById(testId);
    if (!test) {
      throw new NotFoundException('Test not found.');
    }

    const sectionIds: mongoose.Types.ObjectId[] = [];

    if (updateTestDto.sections && Array.isArray(updateTestDto.sections)) {
      for (const section of updateTestDto.sections) {
        const questions = await this.questionModule.find({
          _id: { $in: section.questionIds },
        });

        if (questions.length !== section.questionIds.length) {
          const validIds = questions.map((q) => q._id.toString());
          const invalidIds = section.questionIds.filter(
            (id) => !validIds.includes(id.toString()),
          );
          throw new BadRequestException(
            `Invalid question IDs in section "${section.name}": ${invalidIds.join(', ')}`,
          );
        }

        let sectionDoc;

        if (section._id) {
          const existingSection = await this.sectionModule.findById(
            section._id,
          );
          if (!existingSection) {
            throw new NotFoundException(
              `Section with ID ${section._id} not found.`,
            );
          }

          sectionDoc = await this.sectionModule.findByIdAndUpdate(
            section._id,
            {
              name: section.name,
              name_hi: section.name_hi,
              order: section.order,
              timeLimit: section.timeLimit,
              questions: section.questionIds,
            },
            { new: true },
          );
        } else {
          sectionDoc = await this.sectionModule.create({
            user: user._id,
            name: section.name,
            name_hi: section.name_hi,
            order: section.order,
            timeLimit: section.timeLimit,
            questions: section.questionIds,
          });
        }

        sectionIds.push(sectionDoc._id);
      }

      (updateTestDto as any).sections = sectionIds;

      if (updateTestDto.sections) {
        const allQuestionIds = updateTestDto.sections.flatMap(
          (section: any) => section.questionIds,
        );
        const totalQuestions = await this.questionModule.countDocuments({
          _id: { $in: allQuestionIds },
        });

        updateTestDto.totalQuestions = totalQuestions;
      }
    }

    if (updateTestDto.durationInMinutes) {
      updateTestDto.durationInMinutes = updateTestDto.durationInMinutes * 60;
    }

    const update = await this.testModule.findByIdAndUpdate(
      testId,
      updateTestDto,
      { new: true },
    );

    return {
      message: 'test updated successfully',
      data: update,
    };
  }

  async deleteTest(id: string) {
    const test = await this.testModule.findByIdAndUpdate(id);

    if (!test) {
      throw new NotFoundException('test not found, please enter correct Id');
    }

    return {
      message: 'Test deleted successfully',
    };
  }

  async fetchAllTestsByAdmins() {
    return {
      message: 'tests fetched successfully',
      data: await this.testModule.find().populate('sections user'),
      success: true,
    };
  }

  async fetchOneTestByAdmins(testId: string) {
    const test = await this.testModule
      .findById(testId)
      .populate('sections user exam');

    if (!test) {
      throw new NotFoundException('test not found, please enter correct ID');
    }

    return {
      message: 'test fetched successfully',
      data: test,
      success: true,
    };
  }

  async searchTests(
    query?: string,
    page = 1,
    limit = 10,
    type: 'mock' | 'live' | 'all' = 'all',
  ) {
    const searchRegex = new RegExp(query || '', 'i');
    const skip = (page - 1) * limit;

    const filter: any = {
      $or: [{ title: searchRegex }, { title_hi: searchRegex }],
    };

    if (type && type !== 'all') {
      filter.type = type;
    }

    const total = await this.testModule.countDocuments(filter);

    const tests = await this.testModule.find(filter).skip(skip).limit(limit);

    return {
      message: 'Tests fetched successfully',
      data: {
        tests,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async updateStatusOfTest(updateStatusDto: updateStatusDto, testId: string) {
    const test = await this.testModule.findByIdAndUpdate(
      testId,
      updateStatusDto,
      { new: true },
    );

    if (!test) {
      throw new NotFoundException('Test not found, please enter correct ID.');
    }

    return {
      message: 'Status updated successfully',
      success: true,
    };
  }

  private async getTopLevelCategoryId(
    categoryId: mongoose.Types.ObjectId,
  ): Promise<mongoose.Types.ObjectId> {
    let currentCategory = await this.categoryModule
      .findById(categoryId)
      .select('parent')
      .lean();

    if (!currentCategory) {
      throw new Error('Category not found');
    }

    while (currentCategory.parent) {
      currentCategory = await this.categoryModule
        .findById(currentCategory.parent)
        .select('parent')
        .lean();
      if (!currentCategory) break;
    }

    return currentCategory?._id || categoryId;
  }

  async getTestsByCategory(
    categoryId?: string,
    userId?: string,
    filter?: string,
  ) {
    let examIds: mongoose.Types.ObjectId[] = [];
    let submittedTestIds: mongoose.Types.ObjectId[] = [];
    let hasSubscription = false;
    // let isAccessible = false;
    let user;

    if (userId) {
      user = await this.authModule
        .findById(userId)
        .select('submittedTests')
        .lean();

      submittedTestIds = user?.submittedTests || [];
    }

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      const topCategoryId = await this.getTopLevelCategoryId(
        new mongoose.Types.ObjectId(categoryId),
      );

      const subscription = await this.userSubscriptionModule
        .find({
          user: userId,
          categories: { $in: [topCategoryId] },
          status: 'active',
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
        })
        .lean();

      hasSubscription = Array.isArray(subscription) && subscription.length > 0;
    }

    const testFilter: any = {
      status: 'published',
    };

    if (filter === 'attempted') {
      if (!userId) {
        throw new Error('Authentication required to fetch attempted tests');
      }

      const freeTrialConfig = await this.freeTrialModule.findOne({
        isActive: true,
      });

      // if (freeTrialConfig) {
      //   const trialDays = freeTrialConfig.days;

      //   const createdAt = user.get('createdAt');
      //   const trialEndDate = new Date(createdAt);
      //   trialEndDate.setDate(trialEndDate.getDate() + trialDays);

      //   isAccessible = new Date() <= trialEndDate;
      // }

      if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
        const category = await this.categoryModule.findById(categoryId).lean();
        if (!category) {
          throw new Error('Category not found');
        }

        examIds = category.exams;
        testFilter._id = { $in: submittedTestIds };
        testFilter.exam = { $in: examIds };
      } else if (categoryId) {
        throw new Error('Invalid category ID');
      } else {
        testFilter._id = { $in: submittedTestIds };
      }
    } else {
      if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
        const category = await this.categoryModule.findById(categoryId).lean();
        if (!category) {
          throw new Error('Category not found');
        }

        examIds = category.exams;
        testFilter.exam = { $in: examIds };

        if (userId) {
          testFilter._id = { $nin: submittedTestIds };
        }
      } else if (categoryId) {
        throw new Error('Invalid category ID');
      }
    }

    const tests = await this.testModule
      .find(testFilter)
      .lean()
      .populate('exam');

    return {
      message: 'Tests fetched successfully',
      hasSubscription,
      // isAccessible,
      data: tests,
      success: true,
    };
  }

  async getLiveTests(userId?: string) {
    let submittedTestIds: mongoose.Types.ObjectId[] = [];

    if (userId) {
      const user = await this.authModule
        .findById(userId)
        .select('submittedTests')
        .lean();

      submittedTestIds = user?.submittedTests || [];
    }

    const filter: any = {
      type: 'live',
      status: 'published',
    };

    if (userId && submittedTestIds.length > 0) {
      filter._id = { $nin: submittedTestIds };
    }

    const tests = await this.testModule.find(filter).lean().populate('exam');

    return {
      message: 'Live tests fetched successfully',
      data: tests,
      success: true,
    };
  }

  async createTestAllIndia(id: string, createTestDto: createTestDtoAllIndia) {
    const user = await this.authModule.findById(id);

    if (!user) {
      throw new NotFoundException('user not found!, Please signup.');
    }

    if (createTestDto.type === 'live') {
      if (
        !createTestDto.startDate ||
        !createTestDto.startTime ||
        !createTestDto.endDate ||
        !createTestDto.endTime
      ) {
        throw new BadRequestException(
          'startDate, startTime, endDate, and endTime are required for test type "live".',
        );
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(createTestDto.startDate);
    const end = new Date(createTestDto.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start < today || end < today) {
      throw new BadRequestException(
        'startDate and endDate cannot be in the past.',
      );
    }

    if (end < start) {
      throw new BadRequestException(
        'endDate cannot be earlier than startDate.',
      );
    }

    const durationInSeconds = createTestDto.durationInMinutes * 60;

    const sections: { id: mongoose.Types.ObjectId; questions: string[] }[] = [];

    for (const section of createTestDto.sections) {
      const validQuestions = await this.questionModule.find({
        _id: { $in: section.questionIds },
      });

      if (validQuestions.length !== section.questionIds.length) {
        throw new BadRequestException('One or more questionIds are invalid');
      }

      const createdSection = await this.sectionModule.create({
        user: user._id,
        name: section.name,
        name_hi: section.name_hi,
        order: section.order,
        timeLimit: section.timeLimit,
        questions: section.questionIds,
      });

      sections.push({
        id: createdSection._id,
        questions: section.questionIds,
      });
    }

    if (createTestDto.type != 'live') {
      throw new BadRequestException('Only live tests are accepted');
    }

    const test = await this.testModule.create({
      user: user._id,
      title: createTestDto.title,
      title_hi: createTestDto.title_hi,
      totalQuestions: sections.reduce(
        (acc, curr) => acc + curr.questions.length,
        0,
      ),
      totalSections: createTestDto.totalSections,
      durationInMinutes: durationInSeconds,
      totalMarks: createTestDto.totalMarks,
      marksPerQuestion: createTestDto.marksPerQuestion,
      negativeMarks: createTestDto.negativeMarks,
      description: createTestDto.description,
      description_hi: createTestDto.description_hi,
      languageOptions: createTestDto.languageOptions,
      type: createTestDto.type,
      startDate: createTestDto.startDate,
      startTime: createTestDto.startTime,
      endDate: createTestDto.endDate,
      endTime: createTestDto.endTime,
      sections: sections.map((s) => s.id),
      testType: 'free',
      isAllIndia: true,
      status: 'published',
    });

    return {
      message: 'test created for All India successfully',
      data: test,
      success: true,
    };
  }

  async fetchAllIndiaTests(userId?: string) {
    const query: any = { isAllIndia: true, status: 'published' };

    const tests = await this.testModule.find(query).lean();

    const now = new Date();
    const activeTests = tests.filter((test) => {
      if (!test.endDate) return true;

      const endDateTime = new Date(test.endDate);
      if (test.endTime) {
        const [hours, minutes] = test.endTime.split(':').map(Number);
        endDateTime.setHours(hours, minutes, 0, 0);
      }

      return endDateTime > now;
    });

    let attemptedSet = new Set<string>();

    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const attempted = await this.userTestAttemptModule
        .find({ user: userObjectId })
        .select('testId')
        .lean();

      attemptedSet = new Set(attempted.map((a) => String(a.testId)));
    }

    const result = activeTests.map((test) => ({
      ...test,
      isAttempted: attemptedSet.has(String(test._id)),
    }));

    return {
      message: 'All India tests fetched successfully',
      data: result,
      success: true,
    };
  }

  async deleteTestById(id: string) {
    const test = await this.testModule.findById(id);
    if (!test) {
      throw new NotFoundException('Test not found, please enter correct ID');
    }

    await this.userTestAttemptModule.deleteMany({ testId: id });

    await this.authModule.updateMany(
      { submittedTests: id },
      { $pull: { submittedTests: id } },
    );

    await this.bannerModule.deleteMany({ testId: id });

    if (test.sections && test.sections.length > 0) {
      await this.sectionModule.deleteMany({ _id: { $in: test.sections } });
    }

    await this.testModule.findByIdAndDelete(id);

    return {
      message: 'Test and all related data deleted successfully',
      success: true,
    };
  }

  async fetchAllIndiaTest(testId: string) {
    const test = await this.testModule.findById(testId);

    if (test?.isAllIndia == true) {
      return {
        message: 'Request successful',
        isAllIndia: true,
        success: true,
      };
    } else {
      return {
        message: 'Request unsuccessful',
        isAllIndia: false,
        success: true,
      };
    }
  }
}
