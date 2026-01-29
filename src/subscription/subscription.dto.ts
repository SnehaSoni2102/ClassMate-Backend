import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  ArrayNotEmpty,
  IsIn,
  IsOptional,
} from 'class-validator';

export class addSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Individual Student Plan',
    description: 'Title of the subscription plan',
    required: true,
  })
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example:
      'Ideal for focused learners. Join one group and take tests matched to your class level.',
    description: 'Detailed description of the subscription plan',
    required: true,
  })
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 199,
    description: 'Price of the subscription plan (monthly)',
    required: true,
  })
  price: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'Billing cycle type (e.g., 1,2,3,4,5,6,12)',
    required: true,
  })
  billingCycle: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'Discount added in the form of percentage',
    required: false,
  })
  discountPercentage?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'minimum categories for discount',
    required: false,
  })
  minCategoriesForDiscount?: number;
}
