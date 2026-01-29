import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { NoticeBoardService } from './notice-board.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { createNoticeBoardDto, updateNoticeDto } from './notice-board.dto';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';

@ApiTags('NOTICE BOARD')
@Controller('notice-board')
export class NoticeBoardController {
  constructor(private noticeBoardService: NoticeBoardService) {}

  @Post('add')
  @ApiOperation({ summary: 'Add notice board by admin and super admin' })
  @ApiResponse({
    status: 201,
    description: 'Notice Board added successfully',
    type: createNoticeBoardDto,
  })
  @ApiResponse({ status: 404, description: 'user not found, please signup.' })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  addNotice(
    @Request() req,
    @Body() createNoticeBoardDto: createNoticeBoardDto,
  ) {
    const id = req.user._id;

    return this.noticeBoardService.addNotice(id, createNoticeBoardDto);
  }

  @Get('fetchAll')
  @ApiOperation({ summary: 'Fetch all Notices of notice board' })
  @ApiResponse({
    status: 200,
    description: 'Notice Board fetched successfully',
    type: [createNoticeBoardDto],
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  fetchNotice() {
    return this.noticeBoardService.fetchAllNotice();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Fetch one Notice of notice board' })
  @ApiResponse({
    status: 200,
    description: 'Notice Board fetched successfully',
    type: createNoticeBoardDto,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STUDENT)
  fetchOneNotice(@Param('id') id: string) {
    return this.noticeBoardService.fetchOneNotice(id);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update Notice of notice board' })
  @ApiResponse({
    status: 200,
    description: 'Notice Board updated successfully',
    type: updateNoticeDto,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  updateNotice(
    @Param('id') id: string,
    @Body() updateNoticeDto: updateNoticeDto,
  ) {
    return this.noticeBoardService.updateNotice(id, updateNoticeDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Delete Notice of notice board' })
  @ApiResponse({
    status: 200,
    description: 'Notice Board deleted successfully',
    type: updateNoticeDto,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  deleteNotice(@Param('id') id: string) {
    return this.noticeBoardService.deleteNotice(id);
  }
}
