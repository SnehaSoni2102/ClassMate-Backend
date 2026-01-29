import { ApiProperty } from '@nestjs/swagger';

export class SignupResponseDto {
  @ApiProperty({ example: true, description: 'Indicates success' })
  success: boolean;

  @ApiProperty({
    example: 'User signed up successfully',
    description: 'Message',
  })
  message: string;

  @ApiProperty({
    example: {
      id: 'abc123',
      phoneNumber: '6362618604',
      role: 'student',
      lastLogin: '2025-05-09',
    },
    description: 'Returned user object or info',
  })
  data: {
    id: string;
    phoneNumber: string;
    role: string;
    lastLogin: Date;
  };
}

export class VerifyOtpResponseDto {
  @ApiProperty({ example: true, description: 'Indicates success' })
  success: boolean;

  @ApiProperty({
    example: 'OTP Verified successfully',
    description: 'Message',
  })
  message: string;
}

export class ResendOtpResponseDto {
  @ApiProperty({ example: true, description: 'Indicates success' })
  success: boolean;

  @ApiProperty({
    example: 'OTP Resent successfully',
    description: 'Message',
  })
  message: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: true, description: 'Indicates success' })
  success: boolean;

  @ApiProperty({
    example: 'User Loged In successfully',
    description: 'Message',
  })
  message: string;

  @ApiProperty({
    example: {
      id: 'abc123',
      phoneNumber: '6362618604',
      role: 'student',
      lastLogin: '2025-05-09',
    },
    description: 'Returned user object or info',
  })
  data: {
    id: string;
    phoneNumber: string;
    role: string;
    lastLogin: Date;
  };
}

export class UserDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isOnBoardingCompleted: boolean;

  @ApiProperty()
  lastLogin: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  __v: number;
}

export class SubmittedQueryDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty()
  category: string;

  @ApiProperty()
  issue: string;

  @ApiProperty()
  _id: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  __v: number;
}

export class SubmitQueryResponseDto {
  @ApiProperty({ example: 'query submitted successfully!' })
  message: string;

  @ApiProperty({ type: SubmittedQueryDto })
  data: SubmittedQueryDto;
}

export class TestResponseDto {
  @ApiProperty({ example: '682463aed120822b82fdc040' })
  _id: string;

  @ApiProperty({ example: '681e8865ec5e417c6f8d3a94' })
  user: string;

  @ApiProperty({ example: 'IBPS PO Mock Test - 1' })
  title: string;

  @ApiProperty({ example: 100 })
  totalQuestions: number;

  @ApiProperty({ example: 3 })
  totalSections: number;

  @ApiProperty({ example: 90 })
  durationInMinutes: number;

  @ApiProperty({ example: 100 })
  totalMarks: number;

  @ApiProperty({ example: 1 })
  marksPerQuestion: number;

  @ApiProperty({ example: 0.25 })
  negativeMarks: number;

  @ApiProperty({
    example:
      'This is a mock test for IBPS PO preparation consisting of 3 sections with sectional timing.',
  })
  description: string;

  @ApiProperty({ type: [String], example: ['English', 'Hindi'] })
  languageOptions: string[];

  @ApiProperty({ type: [String], example: [] })
  sections: string[];

  @ApiProperty({ example: '2025-05-14T09:34:38.522Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-05-14T09:34:38.522Z' })
  updatedAt: string;

  @ApiProperty({ example: 0 })
  __v: number;
}
