import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class addLibraryDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '6827783844a283c01d343e47',
    description: 'enter section ID',
    required: true,
  })
  sectionId: string;

  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '6827794944a283c01d343e55',
    description: 'enter question ID',
    required: true,
  })
  questionId: string;
}
