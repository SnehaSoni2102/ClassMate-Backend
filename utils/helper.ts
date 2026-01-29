import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { SetMetadata } from '@nestjs/common';

export const generateotp = (): string => {
  // return Math.floor(100000 + Math.random() * 900000).toString();
  return '123456';
};

export const sendOtp = async (
  phoneNumber: string,
  otp: string,
  configService: ConfigService,
) => {
  // const authKey = configService.get<string>('SMSCOUNTRY_AUTHKEY')!;
  // const authToken = configService.get<string>('SMSCOUNTRY_AUTHTOKEN')!;
  // const senderId = configService.get<string>('SMSCOUNTRY_SENDERID')!;

  // const url = `https://restapi.smscountry.com/v0.1/Accounts/${authKey}/SMSes/`;

  // const text = `Dear Students your login OTP for Classmate Test App is ${otp} . Do not disclose this code to anyone. — Team Classmate Test`;

  // const requestBody = {
  //   Text: text,
  //   Number: `91${phoneNumber}`,
  //   SenderId: senderId,
  //   DRNotifyHttpMethod: 'POST',
  //   Tool: 'API',
  // };

  // const auth = Buffer.from(`${authKey}:${authToken}`).toString('base64');

  // return new Promise((resolve, reject) => {
  //   axios
  //     .post(url, requestBody, {
  //       headers: {
  //         Authorization: `Basic ${auth}`,
  //         'Content-Type': 'application/json',
  //       },
  //     })
  //     .then((response) => {
  //       resolve(response);
  //     })
  //     .catch((err: any) => {
  //       // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //       if (err?.response) {
  //         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  //         const data = err.response?.data;

  //         reject(
  //           new HttpException(
  //             // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //             String(data?.message || 'Error sending OTP'),
  //             HttpStatus.BAD_REQUEST,
  //           ),
  //         );
  //       }
  //       // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //       else if (err?.request) {
  //         reject(
  //           new HttpException(
  //             'No response from SMS Country server',
  //             HttpStatus.INTERNAL_SERVER_ERROR,
  //           ),
  //         );
  //       } else {
  //         reject(
  //           new HttpException(
  //             'Unexpected error occurred',
  //             HttpStatus.INTERNAL_SERVER_ERROR,
  //           ),
  //         );
  //       }
  //     });
  // });
  return;
};

export function createOtpRequestBody(phoneNumber: string): {
  otp: string;
  requestBody: any;
} {
  const otp = generateotp();
  const requestBody = {
    route: 'otp',
    variables_values: otp,
    numbers: phoneNumber,
  };

  return { otp, requestBody };
}

export enum UserRole {
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
  STUDENT = 'student',
}

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

export function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
}

export function isQuestionAnswered(userAns?: {
  selectedAnswers: string[];
}): boolean {
  if (!userAns) return false;
  if (!userAns.selectedAnswers) return false;
  if (userAns.selectedAnswers.length === 0) return false;
  if (userAns.selectedAnswers.every((ans) => !ans || ans.trim() === ''))
    return false;
  return true;
}

export enum transactionStatus {
  PENDING = 'PENDING',
  ATTEMPTED = 'ATTEMPTED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  NOT_ATTEMPTED = 'NOT_ATTEMPTED',
  USER_DROPPED = 'USER_DROPPED',
  VOID = 'VOID',
  REFUND = 'REFUND',
  CREATED = 'CREATED',
  AUTHORIZED = 'AUTHORIZED',
}

export enum TRANSACTION_USER {
  student = 'student',
  teacher = 'teacher',
  superadmin = 'superadmin',
}

export function generateUniqueReceipt(): string {
  const prefix = 'cm';
  const timestamp = Date.now().toString();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomStr}`;
}

interface PopulatedUser {
  _id: string;
  Name: string;
  profilePicture: string;
}

interface GroupMember {
  user: PopulatedUser | null;
  role: string;
}

export interface PopulatedGroups {
  _id: string;
  title: string;
  description?: string;
  logo?: string;
  createdBy: string;
  admin: PopulatedUser;
  members: GroupMember[];
  pricePerStudent: [];
}
