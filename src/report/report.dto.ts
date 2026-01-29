import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class reportGroupDto {
  @ApiProperty({
    description: 'ID of the group being reported',
    example: '64b8d3c1c1234567890abcd2',
  })
  @IsNotEmpty()
  @IsMongoId()
  group: string;

  @ApiProperty({
    description: 'List of descriptions explaining the reason for the report',
    example: ['Spam messages', 'Harassment'],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  description: string[];
}
