import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class addSubjectDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'english',
    description: 'name of the subject',
    required: true,
  })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'अंग्रेज़ी',
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

export class updateSubjectDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'science', description: 'Updated subject name' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'विज्ञान',
    description: 'Updated subject name in Hindi',
  })
  name_hi?: string;
}
