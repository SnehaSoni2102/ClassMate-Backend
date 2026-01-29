import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { bannerModule, bannerSchema } from './banner.schema';
import { testModule, testSchema } from 'src/test/test.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { S3UploadService } from 'utils/s3Uploader';
import { youtubeModule, youtubeSchema } from './youtube-link.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: bannerModule.name, schema: bannerSchema },
    ]),
    MongooseModule.forFeature([{ name: testModule.name, schema: testSchema }]),
    MongooseModule.forFeature([
      { name: youtubeModule.name, schema: youtubeSchema },
    ]),
  ],
  providers: [BannerService, JwtStrategy, S3UploadService],
  controllers: [BannerController],
})
export class BannerModule {}
