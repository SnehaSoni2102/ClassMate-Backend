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
import { SectionService } from './section.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';
import {
  addQuestionToSectionByIdDto,
  createSectionDto,
  updateSectionDto,
} from './section.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('SECTION')
@Controller('section')
export class SectionController {
  constructor(private sectionService: SectionService) {}

  @Post('create')
  @ApiOperation({ summary: 'Add Section for a Test' })
  @ApiResponse({
    status: 201,
    description: 'Section Added Successfully',
    type: createSectionDto,
  })
  @ApiResponse({ status: 404, description: 'Test not found | User not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  addSection(@Request() req, @Body() createSectionDto: createSectionDto) {
    const id = req.user._id;

    return this.sectionService.createSection(id, createSectionDto);
  }

  @Get('allSections')
  @ApiOperation({ summary: 'Fetch All Sections' })
  @ApiResponse({
    status: 201,
    description: 'Sections Fetched Successfully',
    type: [createSectionDto],
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  fetchAllSections() {
    return this.sectionService.fetchAllSections();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Fetch One Section' })
  @ApiResponse({
    status: 201,
    description: 'Section Fetched Successfully',
    type: createSectionDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  fetchOneSection(
    @Param('id') id: string,
    @Query('lang') lang: 'en' | 'hi' = 'en',
  ) {
    return this.sectionService.fetchSection(id, lang);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update Section' })
  @ApiResponse({
    status: 201,
    description: 'Section Updated Successfully',
    type: updateSectionDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  updateSection(@Body() updateSectionDto: updateSectionDto) {
    return this.sectionService.updateSection(updateSectionDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Delete Section' })
  @ApiResponse({
    status: 201,
    description: 'Section Deleted Successfully',
    type: createSectionDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  deleteSection(@Param('id') id: string) {
    return this.sectionService.deleteSection(id);
  }

  @Patch('question/:id')
  @ApiOperation({ summary: 'add question to Section by question ID' })
  @ApiResponse({
    status: 201,
    description: 'question Added Successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  addQuestionToSection(
    @Param('id') id: string,
    @Body() addQuestionToSectionByIdDto: addQuestionToSectionByIdDto,
  ) {
    return this.sectionService.addQuestionToSection(
      id,
      addQuestionToSectionByIdDto,
    );
  }
}
