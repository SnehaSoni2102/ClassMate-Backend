import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class addExamDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'SSC constable',
    description: 'enter your exam',
    required: true,
  })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'एसएससी कांस्टेबल',
    description: 'अपनी परीक्षा दर्ज करें',
  })
  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'एसएससी कांस्टेबल',
    description: 'अपनी परीक्षा दर्ज करें (Hindi, optional)',
    required: false,
  })
  name_hi?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: true,
  })
  @IsOptional()
  logo?: string;

  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '682e38370f1106d4a86b4189',
    description: 'category ID',
    required: true,
  })
  categoryId: string;
}

export class fetchexamDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'SSC exam',
    description: 'Enter exam name (optional)',
    required: false,
  })
  name: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiProperty({
    example: true,
    description: 'If true, it returns question count; otherwise not',
    required: false,
  })
  questionCount: boolean;
}

export class addExamToQuestionsDto {
  @IsMongoId()
  @ApiProperty({
    example: '68321ff07b3ced483e4c202e',
    description: 'Enter _id of question',
    required: true,
  })
  question: string;

  @IsMongoId()
  @ApiProperty({
    example: '682e3b82952596c88ab1a0f8',
    description: 'Enter _id of exam',
    required: true,
  })
  exam: string;
}

export class updateExamDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'SSC CGL', description: 'Exam name' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'एसएससी सीजीएल', description: 'Exam name in Hindi' })
  name_hi?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  logo?: string;
}
