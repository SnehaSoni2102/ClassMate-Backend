import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsNotEmpty,
  IsString,
  IsPhoneNumber,
  Length,
  IsOptional,
  IsEmail,
  MinLength,
  IsMongoId,
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
  IsNumber,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@ValidatorConstraint({ async: false })
class IsValidIndianPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: string, args: ValidationArguments) {
    const junkPatterns = [/^(\d)\1+$/, /^1234567890$/];

    for (const pattern of junkPatterns) {
      if (pattern.test(phone)) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid phone number pattern';
  }
}

function IsValidIndianPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidIndianPhoneConstraint,
    });
  };
}

export class signupDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '6362618604',
    description: 'phone number which you want to signup',
  })
  @IsPhoneNumber('IN')
  @IsValidIndianPhone({ message: 'Phone number appears invalid or fake' })
  phoneNumber: string;
}

export class verifyOtpDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '6362618604',
    description: 'phone number which you want to signup',
  })
  @IsPhoneNumber('IN')
  @IsValidIndianPhone({ message: 'Phone number appears invalid or fake' })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  @ApiProperty({
    example: '123456',
    description: 'enter 6 digit otp for verification',
  })
  otp: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'John the DOn',
    description: 'enter the name',
  })
  Name: string;
}

export class resendOtpDto {
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('IN')
  @IsValidIndianPhone({ message: 'Phone number appears invalid or fake' })
  @Length(10)
  @ApiProperty({
    example: '6362618604',
    description: 'phone number which you want to signup',
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'signup | login',
    description: 'action for which scenario you are using',
  })
  action: 'signup' | 'login';
}

export class loginDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '6362618604',
    description: 'phone number which you want to login',
  })
  @IsPhoneNumber('IN')
  @IsValidIndianPhone({ message: 'Phone number appears invalid or fake' })
  phoneNumber: string;
}

export class updateDto {
  @IsString()
  @IsOptional()
  @IsEmail()
  @ApiProperty({
    example: 'riyazn886@gmail.com',
    description: 'Enter your email',
    required: false,
  })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'riyaz',
    description: 'Enter your name',
    required: false,
  })
  Name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '6362618604',
    description: 'Enter your phoneNumber',
    required: false,
  })
  phoneNumber?: string;

  @IsOptional()
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Upload your image',
    required: false,
  })
  profilePicture?: any;
}

export class UpdateUserFormDto extends updateDto {}

export class createSuperAdminDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'riyazn886@gmail.com',
    description: 'enter your email',
    required: true,
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @ApiProperty({
    example: 'manjesh@kgp123',
    description: 'enter your password',
    required: true,
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'admin',
    description: 'enter your role',
    required: true,
    enum: ['admin', 'superadmin'],
  })
  role: string;
}

export class loginAdminDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'riyazn886@gmail.com',
    description: 'enter your email',
    required: true,
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @ApiProperty({
    example: 'manjesh@kgp123',
    description: 'enter your password',
    required: true,
  })
  password: string;
}

export class updateUserStatusDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'active',
    description: 'update status of student',
    enum: ['active', 'inactive'],
  })
  status: string;
}

export class selectCategoryDto {
  @IsMongoId()
  @IsNotEmpty()
  @ApiProperty({
    example: '682e38370f1106d4a86b4189',
    description: '_id of the category',
    required: true,
  })
  categoryId: string;
}

export class selectExamDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  @ApiProperty({
    example: ['682e3b82952596c88ab1a0f8', '682e3b82952596c88ab1a0f9'],
    description: 'Array of Exam IDs to be selected',
    required: true,
    isArray: true,
    type: [String],
  })
  examIds: string[];
}

export class CheckPhoneNumbersDto {
  @ApiProperty({
    description: 'Array of phone numbers to check',
    example: [
      '7977336731',
      '6362618604',
      '9204235953',
      '7319110043',
      '9318464610',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsString({ each: true })
  phoneNumbers: string[];
}

export class createFreeTrialDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'Enter free trial in days',
    required: true,
  })
  days: number;
}

export class updateFreeTrialDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'Enter free trial in days',
    required: false,
  })
  days?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: true,
    description: 'Enter true or false',
    required: false,
  })
  isActive?: boolean;
}

export class addUserDto {
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('IN')
  @IsValidIndianPhone({ message: 'Phone number appears invalid or fake' })
  @ApiProperty({
    example: '6362618604',
    description: 'Phone number of the user',
    required: true,
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'student',
    description: 'Role to assign. Superadmin: any; Admin: admin or student only',
    required: true,
    enum: ['admin', 'superadmin', 'student'],
  })
  role: 'admin' | 'superadmin' | 'student';

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'John Doe',
    description: 'Display name',
    required: false,
  })
  Name?: string;

  @ValidateIf((o) => o.role === 'admin' || o.role === 'superadmin')
  @IsNotEmpty({ message: 'Email is required for admin and superadmin roles' })
  @IsString()
  @IsEmail()
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Required when role is admin or superadmin',
    required: false,
  })
  email?: string;

  @ValidateIf((o) => o.role === 'admin' || o.role === 'superadmin')
  @IsNotEmpty({ message: 'Password is required for admin and superadmin roles' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @ApiProperty({
    example: 'securePass123',
    description: 'Required when role is admin or superadmin (min 6 characters)',
    required: false,
  })
  password?: string;
}
