import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { TRANSACTION_USER } from 'utils/helper';

export class CategorySelectionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '688cc8c6490bcf64fb4fbf69',
    description: 'Category ID',
  })
  categoryId: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 3,
    description:
      'Subscription duration in months (must match one of the category pricing plans)',
  })
  duration: number;
}

export class GroupPurchaseDto {
  @IsMongoId()
  @ApiProperty({
    example: '685057b04ec60ef59069fe14',
    description: 'Enter the _id of the group user wants to buy subscription',
  })
  groupId: string;

  @IsNumber()
  @Min(1)
  @ApiProperty({
    example: 3,
    description: 'Duration in months for the group subscription',
  })
  duration: number;
}

export class createTransactionDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 200,
    description: 'enter the amount',
    required: true,
  })
  amount: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'INR',
    description: 'enter the currency',
    required: true,
  })
  currency: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'teacher',
    description: 'enter the sender mode',
    enum: [TRANSACTION_USER],
    required: true,
  })
  senderMode: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'order for enrolling test',
    description: 'enter the purpose of order payment',
    required: true,
  })
  description: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GroupPurchaseDto)
  @ApiProperty({
    type: GroupPurchaseDto,
    description: 'Details of the group the user wants to buy subscription for',
    required: false,
  })
  group?: GroupPurchaseDto;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CategorySelectionDto)
  @ApiProperty({
    example: [{ categoryId: '688cc8c6490bcf64fb4fbf69', duration: 3 }],
    description: 'Array of categories with duration (in months)',
    required: false,
    type: [CategorySelectionDto],
  })
  categories?: CategorySelectionDto[];
}

export class transactionIdDto {
  @ApiProperty({
    example: '688b2a6c2cd447443fa3f0db',
    description: 'enter your Transaction ID',
  })
  @IsString()
  transactionId: string;
}

export class payOrderDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'ABCD',
    required: true,
    description: 'Enter id of the razorpay server',
  })
  razorpay_order_id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'ABCD',
    required: true,
    description: 'Enter payment id of the razorpay server',
  })
  razorpay_payment_id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'ABCD',
    required: true,
    description: 'Enter razorpay signature of the razorpay server',
  })
  razorpay_signature: string;
}

class GroupUserDto {
  @ApiProperty({
    example: '66c847f9a13c9b2e5b4c9d11',
    description: 'MongoId of the user who is part of the group',
  })
  @IsMongoId({ message: 'Invalid userId format' })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 3,
    description: 'Duration of subscription in months',
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 month' })
  duration: number;
}

export class createGroupTransactionDto {
  @ApiProperty({
    example: '6898c43f8f1839adc83ab2b7',
    description: 'MongoId of the group for which transaction is being made',
  })
  @IsMongoId({ message: 'Invalid groupId format' })
  @IsNotEmpty()
  groupId: string;

  @ApiProperty({
    type: [GroupUserDto],
    description: 'List of users and their respective subscription durations',
    example: [
      { userId: '681e8865ec5e417c6f8d3a94', duration: 1 },
      { userId: '6898859c451ce352f361b03a', duration: 3 },
      { userId: '682b616012b138890fb83503', duration: 3 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupUserDto)
  @IsNotEmpty()
  users: GroupUserDto[];

  @ApiProperty({
    example: 1500,
    description: 'Total transaction amount for all users',
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    example: 'INR',
    description: 'Currency code for the transaction (e.g., INR, USD)',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    example: 'teacher',
    description: 'enter the sender mode',
    enum: [TRANSACTION_USER],
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  senderMode: string;

  @ApiProperty({
    example: 'Group subscription payment',
    description: 'Description of the transaction',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
