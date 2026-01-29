import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { authModule } from './users.schema';
import mongoose, { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  CheckPhoneNumbersDto,
  createFreeTrialDto,
  createSuperAdminDto,
  loginAdminDto,
  loginDto,
  resendOtpDto,
  selectCategoryDto,
  selectExamDto,
  signupDto,
  updateDto,
  updateFreeTrialDto,
  updateUserStatusDto,
  verifyOtpDto,
} from './user.dto';
import { generateotp, sendOtp, UserRole } from 'utils/helper';
import { S3UploadService } from 'utils/s3Uploader';
import * as bcrypt from 'bcryptjs';
import { categoryModule } from 'src/category/category.schema';
import { examModule } from 'src/exam/exam.schema';
import { Types } from 'mongoose';
import { testModule } from 'src/test/test.schema';
import { groupModule } from 'src/group/group.schema';
import { notificationModule } from 'src/notification/notification.schema';
import { otpModule } from './otp.schema';
import { freeTrialModule } from './freeTrail.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(authModule.name) private authModule: Model<authModule>,
    @InjectModel(categoryModule.name)
    private categoryModule: Model<categoryModule>,
    @InjectModel(examModule.name) private examModule: Model<examModule>,
    @InjectModel(testModule.name)
    private testModule: Model<testModule>,
    @InjectModel(groupModule.name)
    private groupModule: Model<groupModule>,
    @InjectModel(notificationModule.name)
    private notificationModule: Model<notificationModule>,
    @InjectModel(otpModule.name)
    private otpModule: Model<otpModule>,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private s3Service: S3UploadService,
    @InjectModel(freeTrialModule.name)
    private freeTrialModule: Model<freeTrialModule>,
  ) { }

  async signup(createUserDto: signupDto) {
    const { phoneNumber } = createUserDto;

    const userExists = await this.authModule.findOne({
      phoneNumber: createUserDto.phoneNumber,
    });

    const otp = generateotp();

    if (userExists) {
      throw new BadRequestException('User already exists. Please login.');
    }

    await sendOtp(createUserDto.phoneNumber, otp, this.configService);

    await this.otpModule.deleteMany({ phoneNumber, action: 'signup' });

    await this.otpModule.create({
      phoneNumber,
      otp,
      action: 'signup',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return {
      message: 'otp sent successfully',
    };
  }

  async verifyOtp(verifyOtpDto: verifyOtpDto) {
    const { phoneNumber, otp } = verifyOtpDto;

    const otpRecord = await this.otpModule.findOne({ phoneNumber, otp });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    if (otpRecord.expiresAt && otpRecord.expiresAt < new Date()) {
      await this.otpModule.deleteOne({ _id: otpRecord._id });
      throw new BadRequestException('OTP expired.');
    }

    await this.otpModule.deleteOne({ _id: otpRecord._id });

    let user = await this.authModule.findOne({
      phoneNumber: phoneNumber,
    });

    if (!user) {
      if (otpRecord.action !== 'signup') {
        throw new NotFoundException('User not found. Please signup first.');
      }

      const freeTrial = await this.freeTrialModule.findOne({ isActive: true });

      user = await this.authModule.create({
        phoneNumber: phoneNumber,
        role: UserRole.STUDENT,
        isOnBoardingCompleted: true,
        Name: verifyOtpDto.Name,
        hasFreeTrial: freeTrial && freeTrial.days > 0 ? true : false,
      });

      await this.notificationModule.create({
        userId: user._id,
        message: `✅ Welcome to Classmate Test! Your account has been successfully registered.`,
        type: 'Account registration',
        sent: true,
      });
    } else {
      if (otpRecord.action === 'signup') {
        throw new BadRequestException('User already exists. Please login.');
      }

      user.isOnBoardingCompleted = true;
      await user.save();
    }

    const newToken = this.jwtService.sign({
      data: {
        _id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });

    return {
      message: 'OTP verified successfully',
      token: newToken,
      user,
    };
  }

  async resendOtp(otpDto: resendOtpDto) {
    const { phoneNumber, action } = otpDto;

    if (action === 'signup') {
      const user = await this.authModule.findOne({
        phoneNumber: phoneNumber,
      });

      if (user) {
        throw new NotFoundException('User Already Exists. Please Login.');
      }
    }

    if (action === 'login') {
      const user = await this.authModule.findOne({
        phoneNumber: phoneNumber,
      });

      if (!user) {
        throw new NotFoundException('User not found. Please sign up.');
      }
    }

    await this.otpModule.deleteMany({ phoneNumber, action });

    const otp = generateotp();
    await sendOtp(phoneNumber, otp, this.configService);

    await this.otpModule.create({
      phoneNumber,
      otp,
      action,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return {
      message: 'OTP resent successfully',
    };
  }

  async login(loginDto: loginDto) {
    const { phoneNumber } = loginDto;

    const user = await this.authModule.findOne({
      phoneNumber: phoneNumber,
    });

    if (!user) {
      throw new NotFoundException('User not found. Please signup first.');
    }

    await this.otpModule.deleteMany({ phoneNumber, action: 'login' });

    const otp = generateotp();
    console.log('Generated OTP for login:', otp);
    await sendOtp(phoneNumber, otp, this.configService);

    await this.otpModule.create({
      phoneNumber,
      otp,
      action: 'login',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return {
      message: `OTP sent for login successfully to ${phoneNumber} otp: ${otp}`,
    };
  }

  async update(id: string, body: updateDto, file?: Express.Multer.File) {
    if (file) {
      const uploadedUrl = await this.s3Service.uploadFile(
        file,
        'profilePictures',
      );
      body.profilePicture = uploadedUrl;
    }

    const user = await this.authModule.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    return {
      message: 'Profile updated successfully',
      data: user,
    };
  }

  async signupAdmin(createUserDto: createSuperAdminDto) {
    const user = await this.authModule.findOne({ email: createUserDto.email });

    if (user) {
      throw new BadRequestException(
        'user already exists, please try with differenct email',
      );
    }

    const password = await bcrypt.hash(createUserDto.password, 10);

    const User = await this.authModule.create({
      email: createUserDto.email,
      password,
      role: UserRole.SUPERADMIN,
      isOnBoardingCompleted: true,
    });

    return {
      message: 'User Signup Successful',
      data: User,
    };
  }

  async loginAdmin(loginAdminDto: loginAdminDto) {
    const user = await this.authModule.findOne({ email: loginAdminDto.email });

    if (!user) {
      throw new NotFoundException('user not found, please signup.');
    }

    const passwordCheck = await bcrypt.compare(
      loginAdminDto.password,
      user.password,
    );

    if (!passwordCheck) {
      throw new BadRequestException(
        'Password did not match, please enter correct password.',
      );
    }

    return {
      token: this.jwtService.sign({
        data: { _id: user._id, role: user.role },
      }),
      data: user,
    };
  }

  async fetchUser(userId: string) {
    const user = await this.authModule
      .findById(userId)
      .select(
        '-submittedTests -myGroups -invitedGroups -requestedToJoinGroups -categories -exams',
      );

    if (!user) {
      throw new NotFoundException('user not found, please sign up.');
    }

    return {
      message: 'user fetched successfully',
      data: user,
      success: true,
    };
  }

  async deactivateUser(userId: string, updateStatusDto: updateUserStatusDto) {
    const user = await this.authModule.findById(userId);

    if (!user) {
      throw new NotFoundException('user not found.');
    }

    user.status = updateStatusDto.status;
    await user.save();

    return {
      message: 'user status updated successfully',
      success: true,
    };
  }

  async selectCategory(userId: string, selectCategoryDto: selectCategoryDto) {
    const user = await this.authModule.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found, please signup.');
    }

    const category = await this.categoryModule.findById(
      selectCategoryDto.categoryId,
    );

    if (!category) {
      throw new NotFoundException(
        'category not found, please enter correct ID',
      );
    }

    user.categories?.push(category._id);
    await user.save();

    return {
      message: 'Category added successfully',
      data: user,
      success: true,
    };
  }

  async selectExam(userId: string, selectExamDto: selectExamDto) {
    const user = await this.authModule.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found, please signup.');
    }

    const validExamIds: Types.ObjectId[] = [];

    for (const examId of selectExamDto.examIds) {
      const exam = await this.examModule.findById(examId);

      if (!exam) {
        throw new NotFoundException(`Exam with ID ${examId} not found.`);
      }

      validExamIds.push(exam._id);
    }

    user.exams = validExamIds;
    await user.save();

    return {
      message: 'Exams updated successfully',
      data: user,
      success: true,
    };
  }

  async getSelectedExams(userId: string, lang: 'en' | 'hi' = 'en') {
    const user = await this.authModule
      .findById(userId)
      .populate('exams')
      .lean();

    if (!user || !user.exams) {
      throw new NotFoundException('User or selected exams not found.');
    }

    const exams = (user.exams || []).map((exam: any) => ({
      id: exam._id,
      name: lang === 'hi' ? exam.name_hi : exam.name,
    }));

    return {
      message: 'Selected exams fetched successfully',
      data: exams,
      success: true,
    };
  }

  async getSummaryForUser(userId: string) {
    const user = await this.authModule
      .findById(userId)
      .select('submittedTests myGroups')
      .lean();

    const testsAtempted = user?.submittedTests?.length || 0;

    const testsCreated = await this.testModule.countDocuments({ user: userId });

    const groupsJoined = user?.myGroups?.length || 0;

    const groupsCreated = await this.groupModule.countDocuments({
      admin: userId,
    });

    const today = new Date();

    const upcomingLiveTests = await this.testModule
      .find({
        type: 'live',
        status: 'published',
        startDate: { $gte: today },
        _id: { $nin: user?.submittedTests || [] },
      })
      .populate({
        path: 'exam',
        select: 'logo',
      })
      .select(
        'title totalMarks totalQuestions durationInMinutes startDate endDate startTime endTime exam',
      )
      .lean();

    const formattedTests = upcomingLiveTests.map((test) => {
      const exam = test.exam as { logo?: string };
      return {
        examLogo: exam?.logo || '',
        title: test.title,
        totalMarks: test.totalMarks,
        totalQuestions: test.totalQuestions,
        duration: test.durationInMinutes,
        startDate: test.startDate?.toISOString() || '',
        endDate: test.endDate?.toISOString() || '',
        startTime: test.startTime,
        endTime: test.endTime,
      };
    });

    return {
      message: 'Dashboard summary fetched successfully',
      data: {
        testsAtempted,
        testsCreated,
        groupsJoined,
        groupsCreated,
        upcomingLiveTests: formattedTests,
      },
      success: true,
    };
  }

  async fetchAttemptedTest(userId: string, testId: string) {
    const user = await this.authModule
      .findById(userId)
      .select('submittedTests');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const attempted = user.submittedTests?.some(
      (submittedTestId) => submittedTestId.toString() === testId,
    );

    return {
      message: 'attempted test fetched successfully',
      attempted: Boolean(attempted),
      success: true,
    };
  }

  async checkPhoneNumbersExist(dto: CheckPhoneNumbersDto) {
    const { phoneNumbers } = dto;
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      throw new BadRequestException('phoneNumbers must be a non-empty array');
    }

    const users = await this.authModule
      .find({ phoneNumber: { $in: phoneNumbers } }, { phoneNumber: 1 })
      .lean();

    const existingPhoneNumbers = users.map((user) => user.phoneNumber);
    const notFoundPhoneNumbers = phoneNumbers.filter(
      (num) => !existingPhoneNumbers.includes(num),
    );

    if (notFoundPhoneNumbers.length > 0) {
      throw new NotFoundException(
        `Phone numbers not found: ${notFoundPhoneNumbers.join(', ')}`,
      );
    }

    return {
      message: 'Phone number validation done successfully',
      data: existingPhoneNumbers,
      success: true,
    };
  }

  async fetchAllUsers(page = 1, limit = 10, searchTerm?: string) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.authModule
        .find(
          {
            $or: [
              { phoneNumber: { $regex: searchTerm || '', $options: 'i' } },
              { Name: { $regex: searchTerm || '', $options: 'i' } },
              { email: { $regex: searchTerm || '', $options: 'i' } },
            ],
          },
          '-password -submittedTests -myGroups -invitedGroups -requestedToJoinGroups -categories -exams',
        )
        .skip(skip)
        .limit(limit)
        .lean(),
      this.authModule.countDocuments(),
    ]);

    return {
      message: 'Users fetched successfully',
      success: true,
      data: users,
      meta: {
        totalUsers: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    };
  }

  async fetchOneUserBySAdmin(userId: string) {
    const user = await this.authModule
      .findById(
        userId,
        '-password -submittedTests -myGroups -invitedGroups -requestedToJoinGroups -categories -exams',
      )
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User fetched successfully',
      success: true,
      data: user,
    };
  }

  async createFreeTrial(userId: string, dto: createFreeTrialDto) {
    const user = await this.authModule.findById(userId);

    if (!user) {
      throw new NotFoundException('user not found, please signup.');
    }

    if (user.role != 'superadmin') {
      throw new ForbiddenException('only super admin can access this.');
    }

    const trial = await this.freeTrialModule.create({
      createdBy: user._id,
      days: dto.days,
      isActive: true,
    });

    return {
      message: 'Free trial data added successfully',
      data: trial,
      success: true,
    };
  }

  async updateFreeTrial(id: string, dto: updateFreeTrialDto, adminId: string) {
    const freeTrial = await this.freeTrialModule.findById(id);

    if (!freeTrial) {
      throw new NotFoundException('Free trial config not found');
    }

    if (dto.days !== undefined) freeTrial.days = dto.days;
    if (dto.isActive !== undefined) freeTrial.isActive = dto.isActive;

    freeTrial.createdBy = new mongoose.Types.ObjectId(adminId);

    await freeTrial.save();

    return {
      message: 'Free trial updated successfully',
      data: freeTrial,
      success: true,
    };
  }

  async searchByName(name: string) {
    return {
      message: 'Users fetched successfuly',
      data: await this.authModule
        .find(
          { Name: { $regex: name, $options: 'i' } },
          '_id phoneNumber profilePicture Name',
        )
        .exec(),
      success: true,
    };
  }

  async fetchFreeTrialbySuperAdmin() {
    return {
      message: 'Free trial data fetched successfully',
      data: await this.freeTrialModule.find(),
      success: true,
    };
  }
}
