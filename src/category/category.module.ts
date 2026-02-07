import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { categoryModule, categorySchema } from './category.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { S3UploadService } from 'utils/s3Uploader';
import { examModule, examSchema } from 'src/exam/exam.schema';
import { testModule, testSchema } from 'src/test/test.schema';
import {
  pricingPlansModule,
  pricingPlansSchema,
} from 'src/pricing/pricing.schema';
import {
  notificationModule,
  notificationSchema,
} from 'src/notification/notification.schema';
import { authModule, authSchema } from 'src/users/users.schema';
import {
  userSubscriptionModule,
  userSubscriptionSchema,
} from 'src/user-subscription/user-subscription.schema';

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
    MongooseModule.forFeature([
      { name: categoryModule.name, schema: categorySchema },
    ]),
    MongooseModule.forFeature([{ name: examModule.name, schema: examSchema }]),
    MongooseModule.forFeature([{ name: testModule.name, schema: testSchema }]),
    MongooseModule.forFeature([
      { name: pricingPlansModule.name, schema: pricingPlansSchema },
    ]),
    MongooseModule.forFeature([
      { name: notificationModule.name, schema: notificationSchema },
    ]),
    MongooseModule.forFeature([{ name: authModule.name, schema: authSchema }]),
    MongooseModule.forFeature([
      { name: userSubscriptionModule.name, schema: userSubscriptionSchema },
    ]),
  ],
  providers: [CategoryService, JwtStrategy, S3UploadService],
  controllers: [CategoryController],
})
export class CategoryModule {}
