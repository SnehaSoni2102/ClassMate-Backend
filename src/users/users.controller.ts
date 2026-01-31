import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  addUserDto,
  CheckPhoneNumbersDto,
  createSuperAdminDto,
  loginAdminDto,
  loginDto,
  resendOtpDto,
  selectCategoryDto,
  selectExamDto,
  signupDto,
  updateDto,
  updateUserStatusDto,
  UpdateUserFormDto,
  verifyOtpDto,
  createFreeTrialDto,
  updateFreeTrialDto,
} from './user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  LoginResponseDto,
  ResendOtpResponseDto,
  SignupResponseDto,
  VerifyOtpResponseDto,
} from 'responseDTOs/swaggerResponse.dto';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { RolesGuard } from 'guards/userRoles.guards';
import { Roles, UserRole } from 'utils/helper';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('USERS')
@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Post('signup')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Signup User using Phone Number' })
  @ApiResponse({
    status: 200,
    description: 'User Signup Successful',
    type: SignupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Please Enter Valid Number',
  })
  signup(@Body() signup: signupDto) {
    return this.userService.signup(signup);
  }

  @Post('verify-otp')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiResponse({
    status: 200,
    description: 'OTP Verified Successfully',
    type: VerifyOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Please Enter Valid OTP',
  })
  verifyOtp(@Body() verifyOtpDto: verifyOtpDto) {
    return this.userService.verifyOtp(verifyOtpDto);
  }

  @Post('resend-otp')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Resend OTP' })
  @ApiResponse({
    status: 200,
    description: 'OTP Resent Successfully',
    type: ResendOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Please Enter Valid OTP',
  })
  resendOtp(@Body() resendOtpDto: resendOtpDto) {
    return this.userService.resendOtp(resendOtpDto);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Login User using Phone Number' })
  @ApiResponse({
    status: 200,
    description: 'User Login Successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Please Enter Valid Number',
  })
  login(@Body() login: loginDto) {
    return this.userService.login(login);
  }

  @Patch('update')
  @ApiOperation({ summary: 'update user details' })
  @ApiBody({
    description: 'User update payload',
    type: UpdateUserFormDto,
  })
  @ApiResponse({
    status: 200,
    description: 'User updation Successful',
    type: updateDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('profilePicture'))
  update(
    @Request() req,
    @Body() updateDto: updateDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const id = req.user._id;
    return this.userService.update(id, updateDto, file);
  }

  @Post('add')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Add new user (Superadmin: any role; Admin: admin or student only)',
  })
  @ApiBody({
    description:
      'User details. Email and password required for admin/superadmin roles.',
    type: addUserDto,
  })
  @ApiResponse({ status: 201, description: 'User added successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or user already exists',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden: insufficient role or not allowed to assign this role',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  addUser(@Request() req, @Body() body: addUserDto) {
    return this.userService.addUser(req.user._id, body);
  }

  @Post('admins/signup')
  @ApiOperation({ summary: 'Signup Super Admin and Admin' })
  @ApiBody({
    description: 'User Signup Successfully',
    type: createSuperAdminDto,
  })
  @ApiResponse({
    status: 200,
    description: 'User signup Successful',
    type: createSuperAdminDto,
  })
  @ApiResponse({
    status: 400,
    description: 'User already exists, please try with different email',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  signupAdmin(@Body() createSuperAdminDto: createSuperAdminDto) {
    return this.userService.signupAdmin(createSuperAdminDto);
  }

  @Post('admins/login')
  @ApiOperation({ summary: 'Login Super Admin and Admin' })
  @ApiBody({
    description: 'User login Successfully',
    type: loginAdminDto,
  })
  @ApiResponse({
    status: 200,
    description: 'User login Successful',
    type: loginAdminDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User does not exists, please signup.',
  })
  @ApiResponse({
    status: 404,
    description: 'Password did not matched, please enter right password.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  loginAdmin(@Body() loginAdminDto: loginAdminDto) {
    return this.userService.loginAdmin(loginAdminDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Fetch user details' })
  @ApiResponse({
    status: 200,
    description: 'user fetched successfully',
    type: UpdateUserFormDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchUser(@Request() req) {
    const userId = req.user._id;
    return this.userService.fetchUser(userId);
  }

  @Post('category')
  @ApiOperation({ summary: 'select category by student' })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Category added successfully',
    type: selectCategoryDto,
  })
  @ApiResponse({ status: 404, description: 'user not found' })
  @ApiResponse({ status: 404, description: 'category not found' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  selectCategory(@Request() req, @Body() selectCategoryDto: selectCategoryDto) {
    return this.userService.selectCategory(req.user._id, selectCategoryDto);
  }

  @Post('exam')
  @ApiOperation({ summary: 'select exam by student' })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'exam added successfully',
    type: selectExamDto,
  })
  @ApiResponse({ status: 404, description: 'user not found' })
  @ApiResponse({ status: 404, description: 'exam not found' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  selectExam(@Request() req, @Body() selectExamDto: selectExamDto) {
    return this.userService.selectExam(req.user._id, selectExamDto);
  }

  @Get('selected-exams')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get selected exams for the logged-in user' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'hi'],
    description: 'Language preference (en/hi)',
  })
  async getSelectedExams(
    @Request() req,
    @Query('lang') lang: 'en' | 'hi' = 'en',
  ) {
    return this.userService.getSelectedExams(req.user._id, lang);
  }

  @Get('all')
  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Fetch all users by pagination by super admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    example: 'John',
  })
  fetchAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('searchTerm') searchTerm?: string,
  ) {
    return this.userService.fetchAllUsers(
      Number(page),
      Number(limit),
      searchTerm,
    );
  }

  @Get('/dashboard-summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user dashbozard summary' })
  async getUserDashboardSummary(@Req() req) {
    const userId = req.user._id;
    return this.userService.getSummaryForUser(userId);
  }

  @Post('status/:id')
  @ApiOperation({ summary: 'update status of student by super-admin' })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'user status updated successfully' })
  @ApiResponse({ status: 404, description: 'user not found' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  deactivateUser(
    @Param('id') id: string,
    @Body() updateStatusDto: updateUserStatusDto,
  ) {
    return this.userService.deactivateUser(id, updateStatusDto);
  }

  @Post('check-phone-numbers')
  @ApiOperation({ summary: 'check phone numbers' })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.STUDENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Phone number validation done successfully',
  })
  @ApiBody({ type: CheckPhoneNumbersDto })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async checkPhoneNumbers(@Body() body: CheckPhoneNumbersDto) {
    return this.userService.checkPhoneNumbersExist(body);
  }

  @Get('attempted/:testId')
  @ApiOperation({ summary: 'fetch user has attempted test or no' })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.STUDENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'attempted test fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'user not found' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async fetchAttemptedTest(@Request() req, @Param('testId') testId: string) {
    return await this.userService.fetchAttemptedTest(req.user._id, testId);
  }

  @Get('one/:userId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Fetch one user by super admin' })
  fetchUserBySAdmin(@Param('userId') userId: string) {
    return this.userService.fetchOneUserBySAdmin(userId);
  }

  @Post('free-trail')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Add free Trial by super admin' })
  addFreeTrail(@Request() req, @Body() days: createFreeTrialDto) {
    return this.userService.createFreeTrial(req.user._id, days);
  }

  @Patch('update-trail/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'update free Trial by super admin' })
  async updateFreeTrial(
    @Param('id') id: string,
    @Body() dto: updateFreeTrialDto,
    @Request() req,
  ) {
    return this.userService.updateFreeTrial(id, dto, req.user._id);
  }

  @Get('name')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'search users by Name' })
  searchUserByName(@Query('name') name: string) {
    return this.userService.searchByName(name);
  }

  @Get('free-trial/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'fetch free trail data by super admin' })
  fetchFreeTrailBySA() {
    return this.userService.fetchFreeTrialbySuperAdmin();
  }
}
