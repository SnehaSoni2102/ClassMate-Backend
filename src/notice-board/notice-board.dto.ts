import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class createNoticeBoardDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'SSC CGL Registration is open.',
    description: 'header of the notice board',
    required: true,
  })
  header: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example:
      'Registration for SSC CGL has been started. The deadline is 20th May, 2024.',
    description: 'description of the notice board',
    required: true,
  })
  description: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'classmatetest.com',
    description: 'link of the notice board',
    required: true,
  })
  link: string;
}

export class updateNoticeDto extends PartialType(createNoticeBoardDto) {}
