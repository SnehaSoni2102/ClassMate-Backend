import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Query,
  Request,
  Res,
  Sse,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Response } from 'express';
import { QuizAttemptService } from './quiz-attempt.service';
import {
  ManualNextQuestionDto,
  SubmitQuizQuestionDto,
} from './quiz-attempt.dto';
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
import { QuizAttemptEventsService } from './quiz-attempt-events.service';

@ApiTags('QUIZ-ATTEMPT')
@Controller('quiz-attempt')
export class QuizAttemptController {
  constructor(
    private svc: QuizAttemptService,
    private readonly events: QuizAttemptEventsService,
  ) {}

  @Post(':quizId/:questionId')
  @ApiOperation({ summary: 'Submit quiz question attempt' })
  @ApiBody({ type: SubmitQuizQuestionDto })
  @ApiResponse({ status: 201, description: 'Question submitted successfully' })
  @ApiResponse({ status: 404, description: 'User not found | Quiz not found | Question not found' })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'hi'],
    description: 'Language of the attempt (affects correctAnswers check)',
  })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['global', 'group'],
    description: 'Attempt scope',
  })
  @ApiQuery({
    name: 'groupId',
    required: false,
    description: 'Group ID when scope is group',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async submitQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() dto: SubmitQuizQuestionDto,
    @Request() req,
    @Query('language') language: 'en' | 'hi' = 'en',
    @Query('scope') scope: 'global' | 'group' = 'global',
    @Query('groupId') groupId?: string,
  ) {
    const userId = req.user._id;
    return this.svc.submitQuestion(
      userId,
      quizId,
      questionId,
      dto,
      language,
      scope,
      groupId,
    );
  }

  @Post('manual-next/:quizId')
  @ApiOperation({ summary: 'Manually move to next quiz question (sends SSE to mobile)' })
  @ApiBody({ type: ManualNextQuestionDto })
  @ApiResponse({ status: 200, description: 'Next question event emitted' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  manualNextQuestion(
    @Param('quizId') quizId: string,
    @Body() dto: ManualNextQuestionDto,
  ) {
    return this.svc.manualNextQuestion(quizId, dto);
  }

  @Sse('events/:quizId')
  @ApiOperation({
    summary: 'SSE stream for quiz answer saved events',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPERADMIN)
  streamQuizEvents(@Param('quizId') quizId: string): Observable<MessageEvent> {
    return this.events.streamForQuiz(quizId);
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

  @Get('question-rankers/:questionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top 5 rankers for a question' })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  getTopQuestionRankers(@Param('questionId') questionId: string) {
    return this.svc.getTopQuestionRankers(questionId);
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

  @Get('final-results/:quizId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Get final top 3 quiz results' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  @ApiQuery({
    name: 'scope',
    enum: ['global', 'group'],
    required: false,
    description: 'Ranking scope',
    example: 'global',
  })
  @ApiQuery({
    name: 'groupId',
    required: false,
    description: 'Required only when scope=group',
    example: '696d0f8a0f7a559e4cd09a1c',
  })
  getFinalResults(
    @Param('quizId') quizId: string,
    @Query('scope') scope: 'global' | 'group' = 'global',
    @Query('groupId') groupId?: string,
  ) {
    return this.svc.getFinalResults(quizId, scope, groupId);
  }

  @Get('user-result/:quizId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Fetch single user final quiz result' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  @ApiQuery({
    name: 'scope',
    enum: ['global', 'group'],
    required: false,
    description: 'Ranking scope',
    example: 'global',
  })
  @ApiQuery({
    name: 'groupId',
    required: false,
    description: 'Required only when scope=group',
    example: '696d0f8a0f7a559e4cd09a1c',
  })
  getUserFinalResult(
    @Request() req,
    @Param('quizId') quizId: string,
    @Query('scope') scope: 'global' | 'group' = 'global',
    @Query('groupId') groupId?: string,
  ) {
    return this.svc.getUserFinalResult(
      quizId,
      req.user._id,
      scope,
      groupId,
    );
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
