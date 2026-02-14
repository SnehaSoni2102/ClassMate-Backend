import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class addCategoryDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'SSC',
    description: 'enter your category',
    required: true,
  })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'एसएससी',
    description: 'अपनी श्रेणी दर्ज करें',
  })
  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'एसएससी',
    description: 'अपनी श्रेणी दर्ज करें (Hindi, optional)',
    required: false,
  })
  name_hi?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'SSC',
    description: 'enter your description',
    required: true,
  })
  description: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'एसएससी',
    description: 'अपनी श्रेणी दर्ज करें',
    required: false,
  })
  @IsOptional()
  description_hi?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: true,
  })
  @IsOptional()
  logo?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: '64c91f884f4f76a3a876d123',
    description: 'Parent category ID (for subcategories)',
    required: false,
  })
  parent?: string;
}

export class updateCategoryDto extends PartialType(addCategoryDto) {}

export class fetchCategoryDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'Science',
    description: 'Search by category name',
    required: false,
  })
  name: string;
}

class PricingPlanDto {
  @ApiProperty({
    example: 3,
    description: 'Duration of the subscription in months',
    required: true,
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    example: 1200,
    description: 'Price for the given duration',
    required: true,
  })
  @IsNumber()
  @Min(0)
  price: number;
}

export class updatePriceDto {
  @ApiProperty({
    description: 'Array of pricing plans with duration and price',
    example: [
      { duration: 1, price: 500 },
      { duration: 3, price: 1200 },
      { duration: 6, price: 2000 },
      { duration: 12, price: 3500 },
    ],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingPlanDto)
  pricingPlans: PricingPlanDto[];
}

export class getCategoryPriceDto {
  @IsArray()
  @IsMongoId({ each: true })
  @ApiProperty({
    example: ['688cc8c6490bcf64fb4fbf69', '66a344aa6a900a814d7ebba4'],
    description: 'Array of category IDs',
  })
  categoryIds: string[];

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({
    example: 3,
    description: 'Duration in months for which to fetch price',
  })
  duration: number;
}
