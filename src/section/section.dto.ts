import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class createSectionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'Aptitude Reasoning',
    description: 'enter the name of section',
    required: true,
  })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'योग्यता तर्क',
    description: 'अनुभाग का नाम दर्ज करें',
  })
  @IsOptional()
  @ApiProperty({
    example: 'योग्यता तर्क',
    description: 'अनुभाग का नाम दर्ज करें (Hindi, optional)',
    required: false,
  })
  name_hi?: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'Enter the order of section',
    required: true,
  })
  order: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 30,
    description: 'Enter the Timelimit for the section',
    required: true,
  })
  timeLimit: number;

  @IsString()
  @IsMongoId()
  @ApiProperty({
    example: '682463aed120822b82fdc040',
    description: 'Enter unique Id of test',
    required: true,
  })
  testId: string;
}

export class updateSectionDto extends PartialType(createSectionDto) {}

export class addQuestionToSectionByIdDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '68321cf27b3ced483e4c200a',
    description: '_id of section',
    required: true,
  })
  sectionId: string;
}
