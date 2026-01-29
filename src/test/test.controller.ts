import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TestService } from './test.service';
import {
  createTestDto,
  createTestDtoAllIndia,
  updateStatusDto,
  updateTestDto,
} from './test.dto';
import { JwtAuthGuard } from 'guards/jwt.guards';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, UserRole } from 'utils/helper';
import { TestResponseDto } from 'responseDTOs/swaggerResponse.dto';
import { JwtService } from '@nestjs/jwt';

@ApiTags('TEST')
@Controller('test')
export class TestController {
  constructor(
    private testService: TestService,
    private jwtService: JwtService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'create test by super-admin and admin' })
  @ApiBody({
    description: 'User update payload',
    type: createTestDto,
  })
  @ApiResponse({
    status: 200,
    description: 'test created successfully.',
    type: createTestDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createTest(@Body() createTestDto: createTestDto, @Request() req) {
    const id = req.user._id;
    return this.testService.createTest(id, createTestDto);
  }

  @Get('allTests')
  @ApiOperation({ summary: 'Fetch All Tests' })
  @ApiResponse({
    status: 200,
    description: 'Tests Fetched Successfully',
    type: [TestResponseDto],
  })
  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async fetchAllTests(@Request() req) {
    let userId: string | undefined;

    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload: any = this.jwtService.verify(token);
        userId = payload?.data?._id;
      } catch (err) {
        userId = undefined;
      }
    }
    return this.testService.fetchAllTests(userId);
  }

  @Get('search')
  @ApiOperation({
    summary: 'search tests by admin and super admin',
  })
  @ApiResponse({
    status: 200,
    description: 'test searched successfully',
    type: [createTestDto],
  })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['mock', 'live', 'all'],
    default: 'all',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async searchTests(
    @Query('query') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type: 'mock' | 'live' | 'all' = 'all',
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;

    return this.testService.searchTests(query, pageNumber, limitNumber, type);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Fetch One Test' })
  @ApiResponse({
    status: 200,
    description: 'Test Fetched Successfully',
    type: TestResponseDto,
  })
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  // @UsePipes(new ValidationPipe({ whitelist: true }))
  async fetchOneTest(@Param('id') id: string) {
    return this.testService.findOneTest(id);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update Test' })
  @ApiResponse({
    status: 200,
    description: 'Test Updated Successfully',
    type: updateTestDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateTest(
    @Param('id') id: string,
    @Body() updateTestDto: updateTestDto,
    @Request() req,
  ) {
    const user = req.user._id;

    return this.testService.updateTest(user, id, updateTestDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Update Test' })
  @ApiResponse({
    status: 200,
    description: 'Test Deleted Successfully',
    type: 'updateDto',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  deleteTest(@Param('id') id: string) {
    return this.testService.deleteTest(id);
  }

  @Get('admin/all')
  @ApiOperation({
    summary: 'fetch all Tests with populated by admin and super admin',
  })
  @ApiResponse({
    status: 200,
    description: 'tests fetched successfully',
    type: createTestDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  fetchAllTestByAdmins() {
    return this.testService.fetchAllTestsByAdmins();
  }

  @Get('/category/all')
  @ApiOperation({ summary: 'Fetch All tests by category ID' })
  @ApiResponse({
    status: 200,
    description: 'Test Fetched Successfully',
    type: TestResponseDto,
  })
  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['attempted'],
    description: 'Pass "attempted" to fetch submitted tests',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getTestsByCategory(
    @Request() req,
    @Query('categoryId') categoryId?: string,
    @Query('filter') filter?: string,
  ) {
    let userId: string | undefined;

    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload: any = this.jwtService.verify(token);
        userId = payload?.data?._id;
      } catch (err) {
        userId = undefined;
      }
    }
    return this.testService.getTestsByCategory(categoryId, userId, filter);
  }

  @Get('/live-tests/all')
  @ApiOperation({
    summary: 'Fetch live tests for users (with or without login)',
  })
  @ApiResponse({
    status: 200,
    description: 'Live tests fetched successfully',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getLiveTests(@Request() req) {
    let userId: string | undefined;

    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload: any = this.jwtService.verify(token);
        userId = payload?.data?._id;
      } catch (err) {
        userId = undefined;
      }
    }

    return this.testService.getLiveTests(userId);
  }

  @Get('all-india/all')
  @ApiOperation({ summary: 'fetch tests for All India' })
  @ApiResponse({
    status: 200,
    description: 'Tests fetched for All India successfully.',
    type: createTestDtoAllIndia,
  })
  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchAllIndia(@Request() req) {
    let userId: string | undefined;

    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload: any = this.jwtService.verify(token);
        userId = payload?.data?._id;
      } catch (err) {
        userId = undefined;
      }
    }

    return this.testService.fetchAllIndiaTests(userId);
  }

  @Get('admin/:id')
  @ApiOperation({
    summary: 'fetch one test with populated by admin and super admin',
  })
  @ApiResponse({
    status: 200,
    description: 'test fetched successfully',
    type: createTestDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  fetchOneTestByAdmins(@Param('id') testId: string) {
    return this.testService.fetchOneTestByAdmins(testId);
  }

  @Get('allIndia/:testId')
  @ApiOperation({ summary: 'Fetch whether test is all india or not' })
  @ApiResponse({
    status: 200,
    description: 'Test Fetched Successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async fetchAllIndiaTests(@Param('testId') testId: string) {
    return this.testService.fetchAllIndiaTest(testId);
  }

  @Patch('status/:testId')
  @ApiOperation({
    summary: 'update status of test by admin and super admin',
  })
  @ApiResponse({
    status: 200,
    description: 'test status updated successfully',
    type: createTestDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  updateStatus(
    @Body() updateStatusDto: updateStatusDto,
    @Param('testId') testId: string,
  ) {
    return this.testService.updateStatusOfTest(updateStatusDto, testId);
  }

  @Post('create-all-india')
  @ApiOperation({ summary: 'create test for All India' })
  @ApiBody({
    description: 'Create test for All India',
    type: createTestDtoAllIndia,
  })
  @ApiResponse({
    status: 200,
    description: 'Test created for All India successfully.',
    type: createTestDtoAllIndia,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createTestAllIndia(
    @Body() createTestDto: createTestDtoAllIndia,
    @Request() req,
  ) {
    const id = req.user._id;
    return this.testService.createTestAllIndia(id, createTestDto);
  }

  @Delete('delete-test/:id')
  @ApiOperation({ summary: 'delete test by ID' })
  @ApiResponse({
    status: 200,
    description: 'Test deleted successfully.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  deleteTestById(@Param('id') id: string) {
    return this.testService.deleteTestById(id);
  }
}
