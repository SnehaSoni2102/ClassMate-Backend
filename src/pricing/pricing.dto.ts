import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';

class PlanDto {
  @ApiProperty({
    description:
      'Duration for the plan in months (depending on business logic)',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Price of the plan',
    example: 499,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;
}

export class createPricingPlansDto {
  @ApiProperty({
    description: 'List of pricing plans',
    type: [PlanDto],
    example: [
      { duration: 1, price: 199 },
      { duration: 3, price: 299 },
      { duration: 6, price: 399 },
      { duration: 12, price: 599 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanDto)
  plans: PlanDto[];

  @ApiProperty({
    description: 'Type of the pricing plan',
    enum: ['category', 'group'],
    example: 'category',
  })
  @IsNotEmpty()
  @IsEnum(['category', 'group'])
  type: string;
}
