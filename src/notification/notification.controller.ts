import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Request,
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
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';
import { markAsReadDto } from './notification.dto';

@ApiTags('NOTIFICATION')
@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get('all')
  @ApiOperation({ summary: 'Fetch All notifications' })
  @ApiResponse({
    status: 200,
    description: 'Notifications fetched successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  fetchAllNotifications(@Request() req: { user: { _id: string } }) {
    return this.notificationService.fetchNotification(req.user._id);
  }

  @Patch('update')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  updateNotification(
    @Request() req: { user: { _id: string } },
    @Body() dto: markAsReadDto,
  ) {
    return this.notificationService.markAsRead(req.user._id, dto);
  }

  @Patch('mark-all-read')
  @ApiOperation({
    summary: 'Mark all notifications as read for the logged-in user',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  @UseGuards(JwtAuthGuard)
  async markAllRead(@Request() req: { user: { _id: string } }) {
    const userId = req.user._id;
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':notificationId')
  @ApiOperation({ summary: 'Delete a single notification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  async deleteOne(
    @Request() req: { user: { _id: string } },
    @Param('notificationId') notificationId: string,
  ): Promise<{ message: string; success: boolean }> {
    const result = await this.notificationService.deleteNotification(
      req.user._id,
      notificationId,
    );
    return result;
  }
}
