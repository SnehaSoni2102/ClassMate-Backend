import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { LibraryService } from './library.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { addLibraryDto } from './library.dto';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';

@ApiTags('LIBRARY')
@Controller('library')
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Post('add')
  @ApiOperation({ summary: 'add question to library by student' })
  @ApiResponse({
    status: 200,
    description: 'Library added successfully',
    type: addLibraryDto,
  })
  @ApiResponse({ status: 404, description: 'Section ID not found' })
  @ApiResponse({ status: 404, description: 'Question ID not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  addLibrary(@Body() addLibraryDto: addLibraryDto, @Request() req) {
    const id = req.user._id;
    return this.libraryService.addLibrary(id, addLibraryDto);
  }

  @Get('fetch')
  @ApiOperation({ summary: 'fetch library of student' })
  @ApiResponse({
    status: 200,
    description: 'Library fetched successfully',
    type: addLibraryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User have not added any library yet.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchLibrary(@Request() req) {
    const id = req.user._id;
    return this.libraryService.fetchUserLibrary(id);
  }

  @Get('sections')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'fetch library sections and questions count' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  fetchSectionsAndQuestions(@Request() req) {
    const userId = req.user._id;
    return this.libraryService.getUserLibraryWithSections(userId);
  }

  @Get('/:sectionId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'fetch questions inside each section of library' })
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  async getUserQuestionsBySection(
    @Request() req,
    @Param('sectionId') sectionId: string,
  ) {
    const userId = req.user._id;
    return this.libraryService.getUserQuestionsBySection(userId, sectionId);
  }
}
