import {
  Body,
  Controller,
  Get,
  Post,
  Query,
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
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';
import { createPricingPlansDto } from './pricing.dto';

@ApiTags('PRICE-PLANS')
@Controller('pricing')
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @Post('add')
  @ApiOperation({ summary: 'add pricing plans' })
  @ApiResponse({ status: 201, description: 'Pricing plans added successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN)
  addPrice(
    @Request() req,
    @Body() createPricingPlansDto: createPricingPlansDto,
  ) {
    return this.pricingService.addPricingPlans(
      createPricingPlansDto,
      req.user._id,
    );
  }

  @Get('all')
  @ApiOperation({ summary: 'fetch pricing plans by super admin' })
  @ApiResponse({
    status: 201,
    description: 'Pricing plans fetched successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN)
  fetchAll() {
    return this.pricingService.fetchAll();
  }

  @Get('all/group')
  @ApiOperation({ summary: 'fetch group pricing plans by super admin' })
  @ApiResponse({
    status: 201,
    description: 'Pricing plans fetched successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN, UserRole.STUDENT, UserRole.ADMIN)
  fetchAllGroupPricing() {
    return this.pricingService.fetchGroupPricing();
  }
}
