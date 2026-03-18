import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsMongoId,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QuizQuestionTimeDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '68321cf27b3ced483e4c200a',
    description: 'Question id from question module',
  })
  questionId: string;

  @IsNumber()
  @Min(1)
  @Transform(({ value, obj }) => {
    // accept payload key `time` as an alias for `timeInMinutes`
    if (value !== undefined && value !== null) return value;
    if (obj?.time !== undefined && obj?.time !== null) return obj.time;
    return value;
  })
  @ApiProperty({
    example: 2,
    description: 'Time for this question (in minutes). Also accepts `time` alias.',
  })
  timeInMinutes: number;
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

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiProperty({
    example: 30,
    description:
      'Total duration in minutes (must match sum of questions[].timeInMinutes if provided)',
    required: false,
  })
  durationInMinutes?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: false,
    description:
      'If true, quiz starts instantly (startDate/startTime are overridden to now)',
    required: false,
  })
  scheaduleNow?: boolean;

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
  @IsOptional()
  @IsDateString()
  @ApiProperty({
    example: '2026-02-16',
    description: 'Start date (YYYY-MM-DD) (required when scheaduleNow=false)',
    required: false,
  })
  startDate?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: '10:31',
    description: 'Start time (HH:mm) (required when scheaduleNow=false)',
    required: false,
  })
  startTime?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    example: '2026-02-20',
    description:
      'End date (YYYY-MM-DD). Backend computes end from questions[].time.',
    required: false,
  })
  endDate?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: '10:33',
    description:
      'End time (HH:mm). Backend computes end from questions[].time.',
    required: false,
  })
  endTime?: string;

  @IsOptional()
  @IsString()
  testType?: 'free' | 'paid';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionTimeDto)
  @ApiProperty({
    type: [QuizQuestionTimeDto],
    example: [
      { questionId: '68321cf27b3ced483e4c200a', timeInMinutes: 2 },
      { questionId: '68321cf27b3ced483e4c200b', timeInMinutes: 2 },
    ],
    description:
      'Questions array with per-question time (length must match totalQuestions if provided)',
    required: true,
  })
  questions: QuizQuestionTimeDto[];
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
  @Type(() => QuizQuestionTimeDto)
  questions?: QuizQuestionTimeDto[];
 
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

