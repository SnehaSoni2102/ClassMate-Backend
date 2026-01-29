import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import {
  createGroupTransactionDto,
  createTransactionDto,
  payOrderDto,
  transactionIdDto,
} from './transaction.dto';
import { Roles, UserRole } from 'utils/helper';

@ApiTags('TRANSACTION')
@Controller('transaction')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create transaction details' })
  @ApiResponse({
    status: 200,
    example: 'Transaction details added successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  createTransaction(
    @Request() req,
    @Body() transactionDto: createTransactionDto,
  ) {
    return this.transactionService.createTransaction(
      req.user._id,
      transactionDto,
    );
  }

  @Post('order')
  @ApiOperation({ summary: 'Create order in razorpay' })
  @ApiResponse({
    status: 200,
    example: 'Razorpay order created successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  createOrder(@Request() req, @Body() transactionId: transactionIdDto) {
    return this.transactionService.createOrder(transactionId, req.user._id);
  }

  @Post('payment')
  @ApiOperation({ summary: 'Create payment in razorpay' })
  @ApiResponse({
    status: 200,
    example: 'Razorpay payment done successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiBody({ type: payOrderDto })
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  createPayment(@Request() req, @Body() transactionId: payOrderDto) {
    return this.transactionService.payOrder(transactionId, req.user._id);
  }

  @Get('all')
  @ApiOperation({ summary: 'Fetch all user transactions' })
  @ApiResponse({
    status: 200,
    example: 'User transactions fetched successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  fetchUserTransactions(@Request() req) {
    return this.transactionService.fetchUserTransactions(req.user._id);
  }

  @Get('all/admin')
  @ApiOperation({
    summary: 'Fetch all user transactions by admin or superadmin',
  })
  @ApiResponse({
    status: 200,
    example: 'User transactions fetched successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  fetchUserTransactionsbyAdmin(@Request() req) {
    return this.transactionService.fetchUserTransactionsbyAdmin();
  }

  @Post('create/website')
  @ApiOperation({ summary: 'Create transaction details for teacher' })
  @ApiResponse({
    status: 200,
    example: 'Transaction details added successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  createTransactionForWebsite(
    @Body() transactionDto: createGroupTransactionDto,
  ) {
    return this.transactionService.createGroupTransaction(transactionDto);
  }

  @Post('payment/website')
  @ApiOperation({ summary: 'Create payment in razorpay for teacher' })
  @ApiResponse({
    status: 200,
    example: 'Razorpay payment done successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiBody({ type: payOrderDto })
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  createPaymentForWebsite(@Request() req, @Body() transactionId: payOrderDto) {
    return this.transactionService.payOrderWebsite(transactionId, req.user._id);
  }
}
