import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class addQuestionDto {
  @ApiProperty({ type: 'number', example: 1, description: 'Auto-incrementing serial number' })
  @IsOptional()
  serial_no?: number;

  @ApiProperty({ type: 'string', required: false, example: 'https://s3-url.com/image.jpg' })
  @IsOptional()
  image?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'which is the capital city of India',
    description: 'Question needs to be added',
    required: true,
  })
  text: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'भारत का राजधानी शहर कौन सा है',
    description: 'प्रश्न जोड़ना आवश्यक है',
    required: true,
  })
  text_hi: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['Delhi', 'New Delhi', 'Bangalore', 'Mumbai'],
    description: 'Options for the questions',
    required: true,
  })
  options: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['दिल्ली', 'नई दिल्ली', 'बैंगलोर', 'मुंबई'],
    description: 'प्रश्नों के विकल्प',
    required: true,
  })
  options_hi: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['New Delhi', 'Mumbai'],
    description:
      'List of possible correct answers if multiple answers are allowed',
    required: true,
  })
  correctAnswers: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['नई दिल्ली', 'मुंबई'],
    description:
      'यदि एकाधिक उत्तरों की अनुमति हो तो संभावित सही उत्तरों की सूची',
    required: true,
  })
  correctAnswers_hi: string[];

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    example: 1,
    description: 'marks for the question',
    required: true,
  })
  marks: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    example: 0.25,
    description: 'Negative marks for the questions',
    required: true,
  })
  negativeMarks: number;

  @IsMongoId()
  @IsString()
  @ApiProperty({
    example: '6824765865dae3f6efa6eaf4',
    description: 'unique section ID',
    required: true,
  })
  sectionId: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiProperty({
    example: true,
    description: 'if there are two options select true else false',
    required: true,
  })
  isTwoOptions: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example:
      'As per Census 2011, the Scheduled Tribes (ST) population in India accounted for 8.6% of the total population.',
    description: 'add solution for correct answer',
  })
  solution: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example:
      '2011 की जनगणना के अनुसार, भारत में अनुसूचित जनजाति (एसटी) की आबादी कुल जनसंख्या का 8.6% थी।',
    description: 'सही उत्तर के लिए हिंदी में समाधान जोड़ें',
  })
  solution_hi: string;
}

export class updateQuestionDto extends PartialType(addQuestionDto) {}

export class addQuestionAdminDto {
  @ApiProperty({ type: 'number', example: 1, description: 'Auto-incrementing serial number' })
  @IsOptional()
  serial_no?: number;

  @ApiProperty({ type: 'string', required: false, example: 'https://s3-url.com/image.jpg' })
  @IsOptional()
  image?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'which is the capital city of India',
    description: 'Question needs to be added',
    required: true,
  })
  text: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'भारत का राजधानी शहर कौन सा है',
    description: 'प्रश्न जोड़ना आवश्यक है',
    required: true,
  })
  text_hi: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['Delhi', 'New Delhi', 'Bangalore', 'Mumbai'],
    description: 'Options for the questions',
    required: true,
  })
  options: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['दिल्ली', 'नई दिल्ली', 'बैंगलोर', 'मुंबई'],
    description: 'प्रश्नों के विकल्प',
    required: true,
  })
  options_hi: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['New Delhi', 'Mumbai'],
    description:
      'List of possible correct answers if multiple answers are allowed',
    required: true,
  })
  correctAnswers: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['नई दिल्ली', 'मुंबई'],
    description:
      'यदि एकाधिक उत्तरों की अनुमति हो तो संभावित सही उत्तरों की सूची',
    required: true,
  })
  correctAnswers_hi: string[];

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    example: 1,
    description: 'marks for the question',
    required: true,
  })
  marks: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    example: 0.25,
    description: 'Negative marks for the questions',
    required: true,
  })
  negativeMarks: number;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiProperty({
    example: true,
    description: 'if there are two options select true else false',
    required: true,
  })
  isTwoOptions: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example:
      'As per Census 2011, the Scheduled Tribes (ST) population in India accounted for 8.6% of the total population.',
    description: 'add solution for correct answer',
    required: false,
  })
  solution: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example:
      '2011 की जनगणना के अनुसार, भारत में अनुसूचित जनजाति (एसटी) की आबादी कुल जनसंख्या का 8.6% थी।',
    description: 'सही उत्तर के लिए हिंदी में समाधान जोड़ें',
    required: false,
  })
  solution_hi: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({ example: ['64b7...'], description: 'Topics IDs' })
  topics?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({ example: ['64b7...'], description: 'Subject IDs' })
  subject?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({ example: ['64b7...'], description: 'Class IDs' })
  class?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({ example: ['64b7...'], description: 'Exam IDs' })
  Exams?: string[];
}

export class updateQuestionByIdDto {
  @ApiProperty({ type: 'string', required: false, example: 'https://s3-url.com/image.jpg' })
  @IsOptional()
  image?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'which is the capital city of India',
    description: 'Question needs to be added',
    required: true,
  })
  text: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'भारत का राजधानी शहर कौन सा है',
    description: 'प्रश्न जोड़ना आवश्यक है',
    required: true,
  })
  text_hi: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['Delhi', 'New Delhi', 'Bangalore', 'Mumbai'],
    description: 'Options for the questions',
    required: true,
  })
  options: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['दिल्ली', 'नई दिल्ली', 'बैंगलोर', 'मुंबई'],
    description: 'प्रश्नों के विकल्प',
    required: true,
  })
  options_hi: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['New Delhi', 'Mumbai'],
    description:
      'List of possible correct answers if multiple answers are allowed',
    required: true,
  })
  correctAnswers: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['नई दिल्ली', 'मुंबई'],
    description:
      'यदि एकाधिक उत्तरों की अनुमति हो तो संभावित सही उत्तरों की सूची',
    required: true,
  })
  correctAnswers_hi: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    example: 1,
    description: 'marks for the question',
    required: true,
  })
  marks: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    example: 0.25,
    description: 'Negative marks for the questions',
    required: false,
  })
  negativeMarks: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiProperty({
    example: true,
    description: 'if there are two options select true else false',
    required: true,
  })
  isTwoOptions: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example:
      'As per Census 2011, the Scheduled Tribes (ST) population in India accounted for 8.6% of the total population.',
    description: 'add solution for correct answer',
  })
  solution: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example:
      '2011 की जनगणना के अनुसार, भारत में अनुसूचित जनजाति (एसटी) की आबादी कुल जनसंख्या का 8.6% थी।',
    description: 'सही उत्तर के लिए हिंदी में समाधान जोड़ें',
  })
  solution_hi: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({ example: ['64b7...'], description: 'Topics IDs' })
  topics?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({ example: ['64b7...'], description: 'Subject IDs' })
  subject?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({ example: ['64b7...'], description: 'Class IDs' })
  class?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({ example: ['64b7...'], description: 'Exam IDs' })
  Exams?: string[];
}

export class addQuestionGroupAdminDto {
  @ApiProperty({
    type: 'string',
    example: '',
    description: 'Enter _id of group',
    required: true,
  })
  @IsNotEmpty()
  groupId: string;

  @ApiProperty({ type: 'string', required: false, example: 'https://s3-url.com/image.jpg' })
  @IsOptional()
  image?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'which is the capital city of India',
    description: 'Question needs to be added',
    required: true,
  })
  text: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'भारत का राजधानी शहर कौन सा है',
    description: 'प्रश्न जोड़ना आवश्यक है',
    required: true,
  })
  text_hi: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['Delhi', 'New Delhi', 'Bangalore', 'Mumbai'],
    description: 'Options for the questions',
    required: true,
  })
  options: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['दिल्ली', 'नई दिल्ली', 'बैंगलोर', 'मुंबई'],
    description: 'प्रश्नों के विकल्प',
    required: true,
  })
  options_hi: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['New Delhi', 'Mumbai'],
    description:
      'List of possible correct answers if multiple answers are allowed',
    required: true,
  })
  correctAnswers: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    example: ['नई दिल्ली', 'मुंबई'],
    description:
      'यदि एकाधिक उत्तरों की अनुमति हो तो संभावित सही उत्तरों की सूची',
    required: true,
  })
  correctAnswers_hi: string[];

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    example: 1,
    description: 'marks for the question',
    required: true,
  })
  marks: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    example: 0.25,
    description: 'Negative marks for the questions',
    required: true,
  })
  negativeMarks: number;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiProperty({
    example: true,
    description: 'if there are two options select true else false',
    required: true,
  })
  isTwoOptions: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example:
      'As per Census 2011, the Scheduled Tribes (ST) population in India accounted for 8.6% of the total population.',
    description: 'add solution for correct answer',
    required: false,
  })
  solution: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example:
      '2011 की जनगणना के अनुसार, भारत में अनुसूचित जनजाति (एसटी) की आबादी कुल जनसंख्या का 8.6% थी।',
    description: 'सही उत्तर के लिए हिंदी में समाधान जोड़ें',
    required: false,
  })
  solution_hi: string;
}
