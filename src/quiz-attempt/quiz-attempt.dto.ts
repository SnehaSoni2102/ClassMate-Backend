import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsIn,
  ValidateIf,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AnswerDto {
  @IsNumber()
  @IsInt()
  @Min(0)
  @ApiProperty({
    description: 'Zero-based index of the question in the quiz',
    example: 0,
    required: true,
  })
  questionIndex: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'List of selected option texts (must match one or more of the question options)',
    example: ['Delhi'],
    type: [String],
    required: false,
  })
  selectedOption?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @ApiProperty({
    description: 'Time taken to answer the question (in seconds)',
    example: 32,
    required: false,
  })
  timeTaken?: number;
}

export class SubmitQuizDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Unique quiz ID for the quiz being submitted',
    example: '69977a8bb70672a4730d058e',
    required: true,
  })
  quizId: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The start time of the quiz attempt (ISO 8601)',
    example: '2025-05-14T22:00:00.000Z',
    required: true,
  })
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The end time of the quiz attempt (ISO 8601)',
    example: '2025-05-14T22:30:00.000Z',
    required: true,
  })
  endTime: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  @ApiProperty({
    description: 'List of answers for the quiz attempt',
    type: [AnswerDto],
    required: true,
  })
  answers: AnswerDto[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'en',
    description: 'Language selected for the attempt',
    enum: ['en', 'hi'],
    required: true,
  })
  language: 'en' | 'hi';

  @IsString()
  @IsIn(['global', 'group'])
  @ApiProperty({
    example: 'group',
    description: 'Attempt scope: global or group',
    enum: ['global', 'group'],
    required: true,
  })
  scope: 'global' | 'group';

  @ValidateIf((o) => o.scope === 'group')
  @IsMongoId()
  @IsOptional()
  @ApiProperty({
    example: '696d0f8a0f7a559e4cd09a1c',
    description: 'Group ID (required when scope is group)',
    required: false,
  })
  groupId?: string;
}

