import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class addClassDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '7th',
    description: 'name of the class',
    required: true,
  })
  name: string;

  @IsOptional()
  @IsMongoId()
  @ApiProperty({
    example: '68321ff07b3ced483e4c202e',
    description: '_id of the question',
  })
  question: string;
}

export class updateClassDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Class 10', description: 'Updated class name' })
  name?: string;
}
