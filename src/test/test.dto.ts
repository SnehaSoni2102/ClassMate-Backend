import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { DateTimeRequiredForLive } from 'customValidators/customValidators';

export class CreateSectionDto {
  @IsOptional()
  @IsMongoId()
  @ApiProperty({
    example: '665123abc456def789000111',
    description: 'Section ID (required only for update)',
    required: false,
  })
  _id?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Aptitude Reasoning',
    description: 'Section name in English',
  })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'योग्यता तर्क',
    description: 'Section name in Hindi',
  })
  name_hi?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    example: 1,
    description: 'Order of section',
  })
  order?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    example: 30,
    description: 'Time limit for this section in minutes',
  })
  timeLimit?: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @ApiProperty({
    example: ['6827794944a283c01d343e55', '682779d044a283c01d343e59'],
    description: 'Array of question IDs for this section',
  })
  questionIds: string[];
}

export class createTestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'IBPS PO Mock Test - 1',
    description: 'Title of the Test',
    required: true,
  })
  title: string;

  @ValidateIf((o) => o.type === 'live')
  @IsDateString()
  @IsOptional()
  @ApiProperty({
    example: '2024-08-20',
    description: 'Start date of the test in YYYY-MM-DD format',
    required: false,
  })
  startDate: string;

  @ValidateIf((o) => o.type === 'live')
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '14:30',
    description: 'Start time of the test in HH:mm format (24-hour clock)',
    required: false,
  })
  startTime: string;

  @ValidateIf((o) => o.type === 'live')
  @IsDateString()
  @IsOptional()
  @ApiProperty({
    example: '2024-08-20',
    description: 'End date of the test in YYYY-MM-DD format',
    required: false,
  })
  endDate: string;

  @ValidateIf((o) => o.type === 'live')
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '14:30',
    description: 'end time of the test in HH:mm format (24-hour clock)',
    required: false,
  })
  endTime: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'आईबीपीएस पीओ मॉक टेस्ट - 1',
    description: 'परीक्षण का शीर्षक (Hindi title, optional)',
  })
  title_hi?: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 100,
    description: 'Total Number of Questions',
    required: false,
  })
  totalQuestions: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 3,
    description: 'Total Number of Sections',
    required: false,
  })
  totalSections: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 100,
    description: 'Total Duration in Minutes',
    required: false,
  })
  durationInMinutes: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 100,
    description: 'Total Marks for the test',
    required: false,
  })
  totalMarks: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'Marks per question',
    required: false,
  })
  marksPerQuestion: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 0.25,
    description: 'Negative Marks per question',
    required: false,
  })
  negativeMarks: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example:
      'This is a mock test for IBPS PO preparation consisting of 3 sections with sectional timing.',
    description: 'Description of Test',
    required: true,
  })
  description: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example:
      'यह आईबीपीएस पीओ की तैयारी के लिए एक मॉक टेस्ट है जिसमें अनुभागीय समय के साथ 3 खंड शामिल हैं।',
    description: 'परीक्षण का विवरण (Hindi description, optional)',
  })
  description_hi?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @ApiProperty({
    example: ['English', 'Hindi'],
    description: 'language options',
    required: true,
  })
  languageOptions: string[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'mock',
    description: 'enter test type',
    required: true,
  })
  type: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSectionDto)
  @ApiProperty({
    type: [CreateSectionDto],
    description: 'List of sections to be included in the test',
  })
  sections: CreateSectionDto[];

  @IsOptional()
  @ValidateIf((o) => o.exam != null && o.exam !== '')
  @IsMongoId()
  @ApiPropertyOptional({
    example: '683dbace936c9cd07e7f1816',
    description: 'Enter _id of exam (optional for group tests)',
  })
  exam?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'free',
    description: 'select free or paid',
    required: true,
  })
  testType: string;

  @Validate(DateTimeRequiredForLive)
  _validateTimeFields: boolean;
}

export class updateTestDto extends PartialType(createTestDto) {}

export class enrollTestDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '68260e8622162106287ef96e',
    description: 'underscore ID of Test',
    required: true,
  })
  testId: string;
}

export class updateStatusDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'published',
    description: 'Status of Test',
    required: true,
  })
  status: string;
}

export class createTestDtoAllIndia {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'IBPS PO Mock Test - 1',
    description: 'Title of the Test',
    required: true,
  })
  title: string;

  @ValidateIf((o) => o.type === 'live')
  @IsDateString()
  @IsOptional()
  @ApiProperty({
    example: '2024-08-20',
    description: 'Start date of the test in YYYY-MM-DD format',
    required: false,
  })
  startDate: string;

  @ValidateIf((o) => o.type === 'live')
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '14:30',
    description: 'Start time of the test in HH:mm format (24-hour clock)',
    required: false,
  })
  startTime: string;

  @ValidateIf((o) => o.type === 'live')
  @IsDateString()
  @IsOptional()
  @ApiProperty({
    example: '2024-08-20',
    description: 'End date of the test in YYYY-MM-DD format',
    required: false,
  })
  endDate: string;

  @ValidateIf((o) => o.type === 'live')
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '14:30',
    description: 'end time of the test in HH:mm format (24-hour clock)',
    required: false,
  })
  endTime: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'आईबीपीएस पीओ मॉक टेस्ट - 1',
    description: 'परीक्षण का शीर्षक (Hindi title, optional)',
  })
  title_hi?: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 100,
    description: 'Total Number of Questions',
    required: false,
  })
  totalQuestions: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 3,
    description: 'Total Number of Sections',
    required: false,
  })
  totalSections: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 100,
    description: 'Total Duration in Minutes',
    required: false,
  })
  durationInMinutes: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 100,
    description: 'Total Marks for the test',
    required: false,
  })
  totalMarks: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'Marks per question',
    required: false,
  })
  marksPerQuestion: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 0.25,
    description: 'Negative Marks per question',
    required: false,
  })
  negativeMarks: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example:
      'This is a mock test for IBPS PO preparation consisting of 3 sections with sectional timing.',
    description: 'Description of Test',
    required: true,
  })
  description: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example:
      'यह आईबीपीएस पीओ की तैयारी के लिए एक मॉक टेस्ट है जिसमें अनुभागीय समय के साथ 3 खंड शामिल हैं।',
    description: 'परीक्षण का विवरण (Hindi description, optional)',
  })
  description_hi?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @ApiProperty({
    example: ['English', 'Hindi'],
    description: 'language options',
    required: true,
  })
  languageOptions: string[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'mock',
    description: 'enter test type',
    required: true,
  })
  type: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSectionDto)
  @ApiProperty({
    type: [CreateSectionDto],
    description: 'List of sections to be included in the test',
  })
  sections: CreateSectionDto[];

  @Validate(DateTimeRequiredForLive)
  _validateTimeFields: boolean;
}
