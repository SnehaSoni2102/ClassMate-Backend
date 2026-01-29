import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { authModule, authSchema } from './users.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { S3UploadService } from 'utils/s3Uploader';
import { categoryModule, categorySchema } from 'src/category/category.schema';
import { examModule, examSchema } from 'src/exam/exam.schema';
import { testModule, testSchema } from 'src/test/test.schema';
import { groupModule, groupSchema } from 'src/group/group.schema';
import {
  notificationModule,
  notificationSchema,
} from 'src/notification/notification.schema';
import { otpModule, otpSchema } from './otp.schema';
import { freeTrialModule, freeTrialSchema } from './freeTrail.schema';

@Module({
  imports: [
    PassportModule,
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1y' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: authModule.name, schema: authSchema }]),
    MongooseModule.forFeature([
      { name: categoryModule.name, schema: categorySchema },
    ]),
    MongooseModule.forFeature([{ name: examModule.name, schema: examSchema }]),
    MongooseModule.forFeature([{ name: testModule.name, schema: testSchema }]),
    MongooseModule.forFeature([
      { name: groupModule.name, schema: groupSchema },
    ]),
    MongooseModule.forFeature([
      { name: notificationModule.name, schema: notificationSchema },
    ]),
    MongooseModule.forFeature([{ name: otpModule.name, schema: otpSchema }]),
    MongooseModule.forFeature([
      { name: freeTrialModule.name, schema: freeTrialSchema },
    ]),
  ],
  providers: [UsersService, S3UploadService],
  controllers: [UsersController],
})
export class UsersModule {}
