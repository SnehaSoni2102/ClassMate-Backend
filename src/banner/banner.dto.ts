import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class createBannerDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '', description: '_id of test', required: false })
  testId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'test',
    description: 'Enter type of banner',
    required: true,
    enum: ['test', 'payment', 'other'],
  })
  type: string;
}

export class createYoutubeLinkDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Enter youtube link',
    required: true,
  })
  youtubeLink: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'classmate test',
    description: 'Enter title of the youtube link',
    required: true,
  })
  title: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'सहपाठी परीक्षण',
    description: 'Enter title of the youtube link (Hindi, optional)',
    required: false,
  })
  title_hi?: string;
}
