import {
  Controller,
  Get,
  Param,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserSubscriptionService } from './user-subscription.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';

@ApiTags('USER-SUBSCRIPTION')
@Controller('user-subscription')
export class UserSubscriptionController {
  constructor(private userSubscriptionService: UserSubscriptionService) {}

  @Get('fetch-membership/:groupId')
  @ApiOperation({ summary: 'fetch paid member of group' })
  @Get('is-user-paid/:groupId/:userId')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  @ApiBearerAuth()
  async isUserPaidForGroup(@Param('groupId') groupId: string, @Request() req) {
    const isPaid = await this.userSubscriptionService.isUserPaidForGroup(
      groupId,
      req.user._id,
    );
    return {
      success: true,
      isPaid,
    };
  }

  @Get('subscribed-users/:groupId')
  @ApiOperation({ summary: 'fetch paid members of group' })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  subscribedUsers(@Param('groupId') groupId: string, @Request() req) {
    return this.userSubscriptionService.fetchSubscribedUsersOfGroup(
      groupId,
      req.user._id,
    );
  }

  @Get('user/all')
  @ApiOperation({ summary: 'fetch paid members of group' })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  userSubscriptions(@Request() req): Promise<{
    message: string;
    data: {
      groupsSubscriptions: any[];
      categorySubscriptions: any[];
    };
    success: boolean;
  }> {
    return this.userSubscriptionService.fetchAllUserSubscriptions(req.user._id);
  }
}
