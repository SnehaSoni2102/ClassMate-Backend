import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class addTopicDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'physics',
    description: 'name of the topic',
    required: true,
  })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'भौतिक विज्ञान',
    description: 'विषय का नाम',
    required: true,
  })
  name_hi: string;

  @IsOptional()
  @IsMongoId()
  @ApiProperty({
    example: '68321ff07b3ced483e4c202e',
    description: '_id of the question',
  })
  question: string;
}

export class updateTopicDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Algebra', description: 'Updated topic name' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'बीजगणित', description: 'Updated Hindi topic name' })
  name_hi?: string;
}
