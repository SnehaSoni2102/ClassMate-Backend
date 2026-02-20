import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsMongoId,
} from 'class-validator';

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

  @IsOptional()
  @IsMongoId()
  @ApiProperty({ example: '683dbace936c9cd07e7f1816', description: 'Exam id', required: false })
  exam?: string;

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
  @IsMongoId({ each: true })
  @ApiProperty({
    type: [String],
    example: ['68321cf27b3ced483e4c200a', '68321cf27b3ced483e4c200b'],
    description: 'IDs of questions to include in the quiz',
    required: true,
  })
  questions: string[];
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
  @IsMongoId({ each: true })
  questions?: string[];
 
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
 
  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @IsOptional()
  @IsNumber()
  marksPerQuestion?: number;

  @IsOptional()
  @IsNumber()
  negativeMarks?: number;
}

