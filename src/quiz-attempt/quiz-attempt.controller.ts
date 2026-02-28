import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { QuizAttemptService } from './quiz-attempt.service';
import { SubmitQuizDto } from './quiz-attempt.dto';
import { JwtAuthGuard } from 'guards/jwt.guards';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { Roles, UserRole } from 'utils/helper';

@ApiTags('QUIZ-ATTEMPT')
@Controller('quiz-attempt')
export class QuizAttemptController {
  constructor(private svc: QuizAttemptService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit quiz answers' })
  @ApiBody({ type: SubmitQuizDto })
  @ApiResponse({ status: 201, description: 'Quiz submitted successfully' })
  @ApiResponse({ status: 404, description: 'User not found | Quiz not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async submit(@Body() dto: SubmitQuizDto, @Request() req) {
    const userId = req.user._id;
    return this.svc.submit(userId, dto);
  }

  @Get('fetchAll')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fetch all submitted quizzes (admin/superadmin)',
  })
  @ApiResponse({ status: 200, description: 'All submitted quizzes fetched' })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  fetchAll() {
    return this.svc.fetchAllQuizAttempts();
  }

  @Get('related_quizzes/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch related quizzes by quiz id' })
  @ApiResponse({ status: 200, description: 'Related quizzes fetched' })
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @UseGuards(JwtAuthGuard)
  fetchRelatedQuizzes(@Request() req, @Param('id') id: string) {
    return this.svc.getRelatedQuizzesByQuizId(id, req.user._id);
  }

  @Get('analysis/:quizId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch result/analysis of one quiz attempt' })
  @ApiResponse({ status: 200, description: 'Quiz analysis fetched' })
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  getAnalysis(@Param('quizId') quizId: string, @Request() req) {
    return this.svc.getQuizAnalysisById(quizId, req.user._id);
  }

  @Get('solutions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch questions/solutions with filter' })
  @ApiResponse({ status: 200, description: 'Questions fetched' })
  @ApiQuery({ name: 'quizId', required: true, description: 'Quiz ID' })
  @ApiQuery({
    name: 'filter',
    enum: ['all', 'correct', 'incorrect', 'not_answered'],
    required: false,
    description: 'Filter by performance',
  })
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @UseGuards(JwtAuthGuard)
  getSolutions(
    @Request() req,
    @Query('quizId') quizId: string,
    @Query('filter') filter: 'all' | 'correct' | 'incorrect' | 'not_answered' = 'all',
  ) {
    return this.svc.getQuestionsByFilter(req.user._id, quizId, filter);
  }

  @Get('attempt-summary/:quizId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Fetch quiz attempt summary' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  fetchAttemptSummary(@Request() req, @Param('quizId') quizId: string) {
    return this.svc.getQuizSummary(quizId, req.user._id);
  }

  @Get('ranking/:quizId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Fetch quiz ranking' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  fetchRanking(@Request() req, @Param('quizId') quizId: string) {
    return this.svc.getQuizRanking(quizId, req.user._id);
  }

  @Get('all-india/ranking/:quizId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Fetch all India quiz ranking' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  fetchRankingAllIndia(@Request() req, @Param('quizId') quizId: string) {
    return this.svc.getAllIndiaQuizRanking(quizId, req.user._id);
  }

  @Get('certificate/:quizId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Download certificate PDF for a quiz attempt' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  async downloadCertificate(
    @Request() req: { user: { _id: string } },
    @Param('quizId') quizId: string,
    @Res() res: Response,
  ) {
    const userId = req.user._id;
    const pdfBuffer = await this.svc.generateCertificatePdf(quizId, userId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate-quiz-${quizId}.pdf"`,
    );
    res.end(pdfBuffer);
  }

  @Get(':quizId/question/:questionIndex')
  @ApiOperation({ summary: 'Get question details for a quiz attempt by index' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  @ApiResponse({
    status: 200,
    description: 'Returns question details',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getQuestionDetails(
    @Param('quizId') quizId: string,
    @Param('questionIndex') questionIndex: string,
    @Request() req,
  ) {
    return this.svc.getQuestionDetailsByIndex(
      req.user._id,
      quizId,
      Number(questionIndex),
    );
  }
}
