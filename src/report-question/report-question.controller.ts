import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ReportQuestionService } from './report-question.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';
import {
  reportQuestionDto,
  updateStatusOfReportedQuestionDto,
} from './report-question.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('REPORT QUESTION')
@Controller('report-question')
export class ReportQuestionController {
  constructor(private reportQuestionService: ReportQuestionService) {}

  @Post('add')
  @ApiOperation({ summary: 'report a question' })
  @ApiResponse({
    status: 201,
    description: 'question reported successfully',
    type: reportQuestionDto,
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  reportQuestion(@Request() req, @Body() reportQuestionDto: reportQuestionDto) {
    const id = req.user._id;
    return this.reportQuestionService.reportQuestion(id, reportQuestionDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'fetch all reported questions' })
  @ApiResponse({
    status: 200,
    description: 'All Reported questions fetched successfully',
    type: [reportQuestionDto],
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  FetchAllreportedQuestions() {
    return this.reportQuestionService.fetchAllReportedQuestions();
  }

  @Patch('update-status/:id')
  @ApiOperation({ summary: 'update reported question' })
  @ApiResponse({
    status: 200,
    description: 'Reported question updated successfully',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN)
  updateReportedQuestion(
    @Param('id') id: string,
    @Body()
    updateStatusOfReportedQuestionDto: updateStatusOfReportedQuestionDto,
  ) {
    return this.reportQuestionService.updateStatusOfQuestion(
      id,
      updateStatusOfReportedQuestionDto,
    );
  }
}
