import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SubjectService } from './subject.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { addSubjectDto, updateSubjectDto } from './subject.dto';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';

@ApiTags('SUBJECT')
@Controller('subject')
export class SubjectController {
  constructor(private subjectService: SubjectService) {}

  @Post('add')
  @ApiOperation({ summary: 'add subject to question or just save in database' })
  @ApiResponse({ status: 201, description: 'subject added successfully' })
  @ApiResponse({
    status: 201,
    description: 'subject added to question successfully',
    type: addSubjectDto,
  })
  @ApiResponse({ status: 404, description: 'question not found' })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  addSubject(@Body() addSubjectDto: addSubjectDto) {
    return this.subjectService.addSubject(addSubjectDto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'search subject',
  })
  @ApiResponse({
    status: 200,
    description: 'subject searched successfully',
    type: addSubjectDto,
  })
  @ApiResponse({
    status: 400,
    description: 'subject name is required',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  searchSubjects(
    @Query('name') name: string,
    @Query('questionCount') questionCount: boolean,
  ) {
    return this.subjectService.searchSubjectssByName(name, questionCount);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update subject',
  })
  @ApiResponse({
    status: 200,
    description: 'subject updated successfully',
    type: updateSubjectDto,
  })
  @ApiResponse({
    status: 404,
    description: 'subject not found',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateSubject(
    @Param('id') id: string,
    @Body() updateSubjectDto: updateSubjectDto,
  ) {
    return this.subjectService.updateSubject(id, updateSubjectDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete subject and unlink from its associated question',
  })
  @ApiResponse({
    status: 200,
    description: 'subject deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'subject not found',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  deleteSubject(@Param('id') id: string) {
    return this.subjectService.deleteSubject(id);
  }

  @Get('one/:id')
  @ApiOperation({
    summary: 'Fetch one subject',
  })
  @ApiResponse({
    status: 200,
    description: 'subject fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'subject not found',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchOneSubject(@Param('id') id: string) {
    return this.subjectService.fetchOneSubject(id);
  }
}
