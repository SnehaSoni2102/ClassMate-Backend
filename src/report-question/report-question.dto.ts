import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class reportQuestionDto {
  @IsMongoId()
  @ApiProperty({
    description: 'Unique MongoID',
    example: '6824e71454141714224f9c04',
    required: true,
  })
  question: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @ApiProperty({
    description: 'List of answers for the question',
    example: ['New Delhi', 'Mumbai', 'Bangalore'],
    type: [String],
    required: true,
  })
  answer: string[];
}

export class updateStatusOfReportedQuestionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'resolved',
    description: 'update status of request',
    required: true,
  })
  status: string;
}
