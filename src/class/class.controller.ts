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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClassService } from './class.service';
import { addClassDto, updateClassDto } from './class.dto';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';

@ApiTags('CLASS')
@Controller('class')
export class ClassController {
  constructor(private classService: ClassService) {}

  @Post('add')
  @ApiOperation({ summary: 'add class to question or just save in database' })
  @ApiResponse({ status: 200, description: 'class added successfully' })
  @ApiResponse({
    status: 200,
    description: 'class added to question successfully',
    type: addClassDto,
  })
  @ApiResponse({ status: 404, description: 'question not found' })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  addClass(@Body() addClassDto: addClassDto) {
    return this.classService.addClass(addClassDto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'search class',
  })
  @ApiResponse({
    status: 200,
    description: 'class searched successfully',
    type: addClassDto,
  })
  @ApiResponse({
    status: 400,
    description: 'class name is required',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  searchClass(
    @Query('name') name: string,
    @Query('questionCount') questionCount: boolean,
  ) {
    return this.classService.searchClassesByName(name, questionCount);
  }

  @Patch('update/:id')
  @ApiOperation({
    summary: 'update class',
  })
  @ApiResponse({
    status: 200,
    description: 'class updated successfully',
    type: updateClassDto,
  })
  @ApiResponse({
    status: 404,
    description: 'class not found',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateClass(@Param('id') id: string, @Body() updateClassDto: updateClassDto) {
    return this.classService.updateClass(id, updateClassDto);
  }

  @Delete('delete/:id')
  @ApiOperation({
    summary: 'delete class',
  })
  @ApiResponse({
    status: 200,
    description: 'class deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'class not found',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  deleteClass(@Param('id') id: string) {
    return this.classService.deleteClass(id);
  }

  @Get('one/:id')
  @ApiOperation({
    summary: 'fetch one class',
  })
  @ApiResponse({
    status: 200,
    description: 'class fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'class not found',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchOneClass(@Param('id') id: string) {
    return this.classService.fetchOneClass(id);
  }
}
