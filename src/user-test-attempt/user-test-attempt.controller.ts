import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Res,
} from '@nestjs/common';
import { UserTestAttemptService } from './user-test-attempt.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { submitTestAttemptDto } from './user-test-attempt.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, UserRole } from 'utils/helper';
import { Response } from 'express';

@ApiTags('SUBMIT TEST')
@Controller('submitTest')
export class UserTestAttemptController {
  constructor(private userTestAttemptService: UserTestAttemptService) {}

  @Post('add')
  @ApiOperation({ summary: 'submit test by student' })
  @ApiResponse({
    status: 201,
    description: 'Test Submitted Successfully',
    type: submitTestAttemptDto,
  })
  @ApiResponse({ status: 404, description: 'User Not Found | Test Not Found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  submitTest(
    @Request() req,
    @Body() submitTestAttemptDto: submitTestAttemptDto,
  ) {
    const id = req.user._id;

    return this.userTestAttemptService.submitTest(id, submitTestAttemptDto);
  }

  @Get('fetchAll')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'fetch all submitted tests from admin and superadmin',
  })
  @ApiResponse({
    status: 200,
    description: 'Submitted tests Fetched successfully',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  fetchAllSubmittedTests() {
    return this.userTestAttemptService.fetchAllSubmittedTest();
  }

  @Get('related_tests/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'fetch related tests',
  })
  @ApiResponse({
    status: 200,
    description: 'related tests Fetched successfully',
  })
  @ApiQuery({
    name: 'testName',
    required: false,
    description: 'Fetch related tests by test name',
  })
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @UseGuards(JwtAuthGuard)
  fetchRelatedTests(@Request() req, @Param('id') id: string) {
    const userId = req.user._id;

    return this.userTestAttemptService.getRelatedTestTitlesByTestId(id, userId);
  }

  @Get('analysis/:testId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'fetch result of one test',
  })
  @ApiResponse({
    status: 200,
    description: 'result for one test Fetched successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  getTopicWiseAnalysis(@Param('testId') testId: string, @Request() req) {
    return this.userTestAttemptService.getTestAnalysisById(
      testId,
      req.user._id,
    );
  }

  @Get('solutions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'fetch result solution of one test',
  })
  @ApiResponse({
    status: 200,
    description: 'result for one test solution Fetched successfully',
  })
  @ApiQuery({
    name: 'filter',
    enum: ['all', 'correct', 'incorrect', 'not_answered'],
    required: false,
    description: 'Filter the questions based on user performance',
  })
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @UseGuards(JwtAuthGuard)
  getQuestionsBySection(
    @Request() req,
    @Query('testId') testId: string,
    @Query('filter') filter: 'all' | 'correct' | 'incorrect' | 'not_answered',
  ) {
    const userId = req.user._id;

    return this.userTestAttemptService.getQuestionsBySectionByTestId(
      userId,
      testId,
      filter,
    );
  }

  @Get(':testId/question/:questionId')
  @ApiOperation({ summary: 'Get question details for a test attempt' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  @ApiResponse({
    status: 200,
    description: 'Returns question details',
    schema: {
      example: {
        data: {
          questionNumber: 3,
          isBookMarkedByMe: true,
          questionText: 'What is the capital of France?',
          correctAnswers: ['Paris'],
          userSelectedAnswers: ['London'],
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getQuestionDetails(
    @Param('testId') testId: string,
    @Param('questionId') questionId: string,
    @Request() req,
  ) {
    return this.userTestAttemptService.getQuestionDetailsById(
      req.user._id,
      testId,
      questionId,
    );
  }

  @Get('attempt-summary/:testId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'fetch test summary' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  fetchTestSummary(@Request() req, @Param('testId') testId: string) {
    return this.userTestAttemptService.getTestSummary(testId, req.user._id);
  }

  @Get('ranking/:testId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'fetch test ranking' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  fetchRanking(@Request() req, @Param('testId') testId: string) {
    return this.userTestAttemptService.getTestRanking(testId, req.user._id);
  }

  @Get('all-india/ranking/:testId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'fetch all india test ranking' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  fetchRankingAllIndia(@Request() req, @Param('testId') testId: string) {
    return this.userTestAttemptService.getAllIndiaTestSubmissions(
      testId,
      req.user._id,
    );
  }

  @Get('certificate/:testId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'download certificate PDF for a test attempt' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  async downloadCertificate(
    @Request() req: { user: { _id: string } },
    @Param('testId') testId: string,
    @Res() res: Response,
  ) {
    const userId = req.user._id;
    const pdfBuffer = await this.userTestAttemptService.generateCertificatePdf(
      testId,
      userId,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate-${testId}.pdf"`,
    );
    res.end(pdfBuffer);
  }
}
