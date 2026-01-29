import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum SupportCategory {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  BILLING = 'billing',
}

export class submitQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(SupportCategory)
  @ApiProperty({ enum: SupportCategory, example: 'general' })
  category: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'I am facing some issue while opening the application',
  })
  issue: string;
}
