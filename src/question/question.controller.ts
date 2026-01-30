/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import {
  addQuestionAdminDto,
  addQuestionDto,
  addQuestionGroupAdminDto,
  updateQuestionByIdDto,
  updateQuestionDto,
} from './question.dto';
import { Roles, UserRole } from 'utils/helper';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('QUESTION')
@Controller('question')
export class QuestionController {
  constructor(private questionService: QuestionService) {}

  @Delete('bulk-delete')
  @ApiOperation({
    summary: 'bulk delete questions by IDs (body or query params)',
  })
  @ApiResponse({ status: 200, description: 'questions deleted successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN)
  @ApiQuery({
    name: 'ids',
    required: false,
    description: 'Comma-separated question IDs (alternative to body)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        questionIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['64f7d8e4c5a9b2d1e4f5g6h7', '64f7d8e4c5a9b2d1e4f5g6h8'],
        },
      },
    },
  })
  bulkDeleteQuestions(
    @Body() body: { questionIds?: string[] },
    @Query('ids') queryIds?: string,
  ) {
    let questionIds: string[] = [];

    // Try to get IDs from body first
    if (body && body.questionIds && Array.isArray(body.questionIds)) {
      questionIds = body.questionIds;
    }
    // Fallback to query parameter (comma-separated)
    else if (queryIds) {
      questionIds = queryIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id);
    }

    if (!questionIds || questionIds.length === 0) {
      throw new BadRequestException(
        'questionIds array is required and cannot be empty. Provide questionIds in request body or use ?ids= query parameter',
      );
    }

    return this.questionService.bulkDeleteQuestions(questionIds);
  }

  @Get('upload-url')
  @ApiOperation({ summary: 'Get pre-signed URL for image upload' })
  @ApiResponse({
    status: 200,
    description: 'Pre-signed URL generated successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  @ApiQuery({ name: 'contentType', required: true, example: 'image/jpeg' })
  async getUploadUrl(@Query('contentType') contentType: string) {
    return this.questionService.getUploadUrl(contentType);
  }

  @Post('add')
  @ApiOperation({ summary: 'add question to section' })
  @ApiResponse({
    status: 201,
    description: 'question added successfully',
    type: addQuestionDto,
  })
  @ApiResponse({
    status: 404,
    description: 'section not found, please enter correct ID',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  addQuestion(@Body() addQuestionDto: addQuestionDto) {
    return this.questionService.addQuestions(addQuestionDto);
  }

  @Get('allQuestions')
  @ApiOperation({ summary: 'fetch all questions' })
  @ApiResponse({
    status: 201,
    description: 'questions fetched successfully',
    type: [addQuestionDto],
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  fetchAllQuestions() {
    return this.questionService.fetchAllQuestions();
  }

  @Get('search')
  @ApiOperation({ summary: 'search question by admin and super admin' })
  @ApiResponse({
    status: 200,
    description: 'question searched successfully',
    type: addQuestionDto,
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 400, description: 'please enter query' })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({
    name: 'questionType',
    required: false,
    enum: ['single', 'multiple', 'all'],
  })
  @ApiQuery({ name: 'topicIds', required: false, isArray: true, type: String })
  @ApiQuery({
    name: 'subjectIds',
    required: false,
    isArray: true,
    type: String,
  })
  @ApiQuery({ name: 'classIds', required: false, isArray: true, type: String })
  @ApiQuery({ name: 'examIds', required: false, isArray: true, type: String })
  searchQuestions(
    @Query('searchTerm') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('questionType') questionType?: 'single' | 'multiple' | 'all',
    @Query('topicIds') topicIds?: string | string[],
    @Query('subjectIds') subjectIds?: string | string[],
    @Query('classIds') classIds?: string | string[],
    @Query('examIds') examIds?: string | string[],
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;

    const filters = {
      topicIds: Array.isArray(topicIds) ? topicIds : topicIds ? [topicIds] : [],
      subjectIds: Array.isArray(subjectIds)
        ? subjectIds
        : subjectIds
          ? [subjectIds]
          : [],
      classIds: Array.isArray(classIds) ? classIds : classIds ? [classIds] : [],
      examIds: Array.isArray(examIds) ? examIds : examIds ? [examIds] : [],
    };

    return this.questionService.searchQuestions(
      query,
      questionType,
      pageNumber,
      limitNumber,
      filters,
    );
  }

  @Get('/:id')
  @ApiOperation({ summary: 'fetch one question' })
  @ApiResponse({
    status: 201,
    description: 'question fetched successfully',
    type: addQuestionDto,
  })
  @ApiResponse({
    status: 404,
    description: 'section not found, please enter correct ID',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  fetchOneQuestion(@Param('id') id: string, @Request() req) {
    return this.questionService.fetchOneQuestion(id, req.user._id);
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'update question to section' })
  @ApiResponse({
    status: 201,
    description: 'question updated successfully',
    type: addQuestionDto,
  })
  @ApiResponse({
    status: 404,
    description: 'section not found, please enter correct ID',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  updateQuestion(
    @Param('id') id: string,
    @Body() updateQuestionDto: updateQuestionDto,
  ) {
    return this.questionService.updateQuestion(id, updateQuestionDto);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'delete question from section' })
  @ApiResponse({
    status: 201,
    description: 'question deleted successfully',
    type: 'Question Deleted Successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'question not found, please enter correct ID',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  deleteQuestion(@Param('id') id: string) {
    return this.questionService.deleteQuestion(id);
  }

  @Post('admin')
  @ApiOperation({ summary: 'add question by admin' })
  @ApiResponse({
    status: 201,
    description: 'question added successfully',
    type: addQuestionAdminDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  addQuestionByAdmin(@Body() addQuestionAdminDto: addQuestionAdminDto) {
    return this.questionService.addQuestionByAdmin(addQuestionAdminDto);
  }

  @Post('group-admin')
  @ApiOperation({ summary: 'add question by group admin' })
  @ApiResponse({
    status: 201,
    description: 'question added successfully',
    type: addQuestionGroupAdminDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  addQuestionByGroupAdmin(
    @Body() addQuestionAdminDto: addQuestionGroupAdminDto,
  ) {
    return this.questionService.addQuestionByAdmin(addQuestionAdminDto);
  }

  @Patch('update/:questionId')
  @ApiOperation({ summary: 'update question by ID by admin and super admin' })
  @ApiResponse({
    status: 201,
    description: 'question updated successfully',
    type: updateQuestionByIdDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  updateQuestionById(
    @Param('questionId') questionId: string,
    @Body() addQuestionDto: updateQuestionByIdDto,
  ) {
    return this.questionService.updateQuestionById(questionId, addQuestionDto);
  }

  @Get('admin/all')
  @ApiOperation({
    summary: 'fetch all question with populated by admin and super admin',
  })
  @ApiResponse({
    status: 200,
    description: 'question fetched successfully',
    type: [addQuestionAdminDto],
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  fetchQuestionsByAdmins() {
    return this.questionService.fetchQuestionsByAdmins();
  }

  @Get('admin/:id')
  @ApiOperation({
    summary: 'fetch one question with populated by admin and super admin',
  })
  @ApiResponse({
    status: 200,
    description: 'question fetched successfully',
    type: addQuestionAdminDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  fetchOneQuestionByAdmins(@Param('id') questionId: string) {
    return this.questionService.fetchOneQuestionByAdmins(questionId);
  }

  @Post('bulk-upload')
  @ApiOperation({ summary: 'bulk upload of questions' })
  @ApiResponse({ status: 201, description: 'questions added successfully' })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/csv',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `question-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(csv)$/)) {
          return cb(
            new BadRequestException('Only CSV files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async bulkupload(@UploadedFile() file: Express.Multer.File) {
    try {
      return await this.questionService.bulkUploadFromCsv(file.path);
    } catch (error) {
      console.error('Bulk upload error:', error);
      throw new InternalServerErrorException('Failed to upload questions');
    }
  }

  @Post('bulk-edit')
  @ApiOperation({ summary: 'bulk edit questions by serial_no' })
  @ApiResponse({ status: 201, description: 'questions updated successfully' })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/csv',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `question-edit-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(csv)$/)) {
          return cb(
            new BadRequestException('Only CSV files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async bulkEdit(@UploadedFile() file: Express.Multer.File) {
    try {
      return await this.questionService.bulkEditFromCsv(file.path);
    } catch (error) {
      console.error('Bulk edit error:', error);
      throw new InternalServerErrorException('Failed to edit questions');
    }
  }

  @Delete('delete-question/:id')
  @ApiOperation({ summary: 'delete question by ID' })
  @ApiResponse({ status: 201, description: 'questions deleted successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN)
  deleteQuestionById(@Param('id') id: string) {
    return this.questionService.deleteQuestionById(id);
  }
}
