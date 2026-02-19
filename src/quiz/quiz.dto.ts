import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  IsNumber,
  ValidateIf,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

class QuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'What is the capital of India?' })
  text: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  @ApiProperty({ example: ['Delhi', 'Mumbai', 'Kolkata'] })
  options: string[];

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Delhi', required: false })
  correctOption?: string;
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'General Knowledge Quiz' })
  title: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Short GK quiz for practice', required: false })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'सामान्य ज्ञान क्विज़', required: false })
  title_hi?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'छोटा जीके क्विज़', required: false })
  description_hi?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ example: 10, required: false })
  totalQuestions?: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  durationInMinutes: number;

  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @IsOptional()
  @IsNumber()
  marksPerQuestion?: number;

  @IsOptional()
  @IsNumber()
  negativeMarks?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({ example: ['English', 'Hindi'], required: false })
  languageOptions?: string[];

  // quizzes are live only — require scheduling fields
  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({ example: '2026-02-16', description: 'Start date (YYYY-MM-DD)', required: true })
  startDate: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '10:31', description: 'Start time (HH:mm)', required: true })
  startTime: string;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({ example: '2026-02-20', description: 'End date (YYYY-MM-DD)', required: true })
  endDate: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '10:33', description: 'End time (HH:mm)', required: true })
  endTime: string;

  @IsOptional()
  @IsString()
  testType?: 'free' | 'paid';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  @ApiProperty({ type: [QuizQuestionDto] })
  questions: QuizQuestionDto[];
}

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions?: QuizQuestionDto[];
 
  @IsOptional()
  @IsNumber()
  durationInMinutes?: number;
  @IsOptional()
  @IsString()
  type?: 'live';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  endTime?: string;
}

