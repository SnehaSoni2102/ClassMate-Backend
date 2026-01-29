import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class markAsReadDto {
  @IsMongoId()
  @ApiProperty({
    example: '68976e966191d0a4e21259f0',
    description: '_id of notification',
    required: true,
  })
  notificationId: string;
}
