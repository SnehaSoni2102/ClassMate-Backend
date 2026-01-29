import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';
import {
  addExamDto,
  addExamToQuestionsDto,
  fetchexamDto,
  updateExamDto,
} from './exam.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('EXAM')
@Controller('exam')
export class ExamController {
  constructor(private examService: ExamService) {}

  @Post('add')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'add exam' })
  @ApiResponse({
    status: 201,
    description: 'exam added successfully',
    type: addExamDto,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  addExam(
    @Body() addExamDto: addExamDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.examService.addExam(addExamDto, file);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search exams by name (case-insensitive)' })
  @ApiResponse({
    status: 200,
    description: 'exams fetched successfully',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchExams(@Query() fetchexamDto: fetchexamDto) {
    return this.examService.fetchExams(fetchexamDto);
  }

  @Post('question')
  @ApiOperation({ summary: 'Link an exam to a question' })
  @ApiResponse({ status: 201, description: 'Exam linked successfully.' })
  @ApiResponse({ status: 400, description: 'Exam already linked.' })
  @ApiResponse({ status: 404, description: 'Question not found.' })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  addExamToQuestion(@Body() addExamToQuestionsDto: addExamToQuestionsDto) {
    return this.examService.addExamToQuestion(addExamToQuestionsDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'update exam' })
  @ApiResponse({ status: 201, description: 'Exam updated successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Exam not found, please enter correct ID',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateExam(
    @Param('id') id: string,
    @Body() updateExamDto: updateExamDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.examService.updateExam(id, updateExamDto, file);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'delete exam' })
  @ApiResponse({ status: 201, description: 'Exam deleted successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Exam not found, please enter correct ID',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  deleteExam(@Param('id') id: string) {
    return this.examService.deleteExam(id);
  }

  @Get('one/:id')
  @ApiOperation({ summary: 'fetch one exam' })
  @ApiResponse({ status: 201, description: 'Exam fetched successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Exam not found, please enter correct ID',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchOneExam(@Param('id') id: string) {
    return this.examService.fetchOneExam(id);
  }
}
