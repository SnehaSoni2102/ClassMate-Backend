import {
  IsNotEmpty,
  IsMongoId,
  IsArray,
  IsDateString,
  ValidateNested,
  ArrayNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  ValidateIf,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class answerDto {
  @IsMongoId()
  @ApiProperty({
    description: 'Unique ID of the question',
    example: '6824a922d943b04831fe539e',
    required: true,
  })
  questionId: string;

  @IsArray()
  // @ArrayNotEmpty() // When we run this validation, we are not able to pass unselected options in answers
  @IsString({ each: true })
  @ApiProperty({
    description: 'List of selected answers for the question',
    example: ['New Delhi'],
    required: true,
  })
  selectedAnswers: string[];

  @IsInt()
  @Min(0)
  @ApiProperty({
    description: 'Time taken to answer the question (in seconds)',
    example: 32,
    required: true,
  })
  timeTaken: number;
}

export class submitTestAttemptDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Unique test ID for the test being submitted',
    example: '682463aed120822b82fdc040',
    required: true,
  })
  testId: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The start time of the test attempt',
    example: '2025-05-14T22:00:00Z',
    required: true,
  })
  startTime: Date;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The end time of the test attempt',
    example: '2025-05-14T22:56:00Z',
    required: true,
  })
  endTime: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => answerDto)
  @ApiProperty({
    description: 'List of answers for the test attempt',
    type: [answerDto],
    required: true,
  })
  answers: answerDto[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'hi',
    description: 'select language',
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
  @IsNotEmpty()
  @ApiProperty({
    example: '6824b76cd943b04831fe539f',
    description: 'Group ID (required when scope is group)',
    required: false,
  })
  groupId?: string;
}
