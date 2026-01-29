import {
  Body,
  Controller,
  Get,
  Post,
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
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { addSubscriptionDto } from './subscription.dto';
import { Roles, UserRole } from 'utils/helper';

@ApiTags('SUBSCRIPTION')
@Controller('subscription')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Post('create')
  @ApiOperation({ summary: 'add subscription plan' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan added successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN)
  createPlan(@Body() addSubscriptionDto: addSubscriptionDto) {
    return this.subscriptionService.createSubscription(addSubscriptionDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'add subscription plan' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan added successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  fetchAllPlans() {
    return this.subscriptionService.fetchAllSubscriptions();
  }
}
