import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { GroupCreatedBy } from './group.schema';

export class createGroupDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Group title',
    example: 'My Study Group',
  })
  title: string;

  @ApiProperty({
    description: 'Group description',
    example: 'This is a group for competitive exam preparation.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description:
      'List of phone numbers to be invited (minimum 5). Accepts array, comma-separated string, or JSON string.',
    example: [
      '8586834117',
      '7985463212',
      '9337690741',
      '9717793012',
      '9097744627',
    ],
    type: [String],
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return value.split(',').map((v: string) => v.trim());
      }
    }
    return value;
  })
  @IsArray()
  @ArrayMinSize(5)
  @IsString({ each: true })
  invitedPhoneNumbers: string[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Upload your logo',
    required: false,
  })
  @IsOptional()
  logo?: string;

  @ApiProperty({
    description: 'Who created the group',
    required: true,
    enum: Object.values(GroupCreatedBy),
    example: 'STUDENT',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(GroupCreatedBy, {
    message: 'createdBy must be one of: TEACHER, STUDENT',
  })
  @IsNotEmpty()
  createdBy: GroupCreatedBy;

  @ApiProperty({
    description: '6362618604',
    example: 'enter your whatsapp link',
    required: false,
  })
  @IsString()
  @IsOptional()
  whatsappLink: string;

  @ApiProperty({
    description: '6362618604',
    example: 'enter your youtube link',
    required: false,
  })
  @IsString()
  @IsOptional()
  youtubeLink: string;
}

export class leaveGroupDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '',
    description: 'Enter _id of group you want to leave',
    required: true,
  })
  groupId: string;
}

export class updateGroupDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Group title',
    example: 'My Study Group',
    required: false,
  })
  title: string;

  @ApiProperty({
    description: 'Group description',
    example: 'This is a group for competitive exam preparation.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    description: '6362618604',
    example: 'enter your whatsapp link',
    required: false,
  })
  @IsString()
  @IsOptional()
  whatsappLink: string;

  @ApiProperty({
    description: '6362618604',
    example: 'enter your youtube link',
    required: false,
  })
  @IsString()
  @IsOptional()
  youtubeLink: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Upload your logo',
    required: false,
  })
  @IsOptional()
  logo?: string;
}

export class inviteUserDto {
  @ApiProperty({
    description:
      'List of phone numbers to be invited (minimum 1). Accepts array, comma-separated string, or JSON string.',
    example: [
      '8586834117',
      '7985463212',
      '9337690741',
      '9717793012',
      '9097744627',
    ],
    type: [String],
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return value.split(',').map((v: string) => v.trim());
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  invitedPhoneNumbers: string[];
}

export class PriceDurationDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty({
    example: 1000,
    description: 'Price per student for this duration',
    required: true,
  })
  price: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'Duration (in months)',
    required: true,
  })
  duration: number;
}

export class updateGroupPriceDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PriceDurationDto)
  @ApiProperty({
    example: [
      { price: 1000, duration: 1 },
      { price: 2500, duration: 3 },
    ],
    description: 'Array of price and duration options for students',
    required: true,
    type: [PriceDurationDto],
  })
  pricePerStudent: PriceDurationDto[];
}

export class getGroupPriceDto {
  @IsArray()
  @IsMongoId({ each: true })
  @ApiProperty({
    example: ['685057b04ec60ef59069fe14', '66a344aa6a900a814d7ebba4'],
    description: 'Array of group IDs',
  })
  groupIds: string[];

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({
    example: 3,
    description: 'Duration in months for which to fetch price',
  })
  duration: number;
}

export class respondToGroupInviteDto {
  @ApiProperty({
    description: 'The ID of the notification',
    example: '64df1c1b8d79d8296c48b712',
  })
  @IsMongoId()
  @IsNotEmpty()
  notificationId: string;

  @ApiProperty({
    description: 'Action to perform on the group invitation',
    enum: ['accept', 'reject'],
    example: 'accept',
  })
  @IsEnum(['accept', 'reject'])
  @IsNotEmpty()
  action: 'accept' | 'reject';
}

export class updateStatusOfTestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'published',
    description: 'Enter the status',
    required: true,
    enum: ['published', 'in-progress'],
  })
  status: string;
}
