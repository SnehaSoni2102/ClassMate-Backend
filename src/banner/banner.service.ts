import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { bannerModule } from './banner.schema';
import { Model } from 'mongoose';
import { S3UploadService } from 'utils/s3Uploader';
import { createBannerDto, createYoutubeLinkDto } from './banner.dto';
import { testModule } from 'src/test/test.schema';
import { youtubeModule } from './youtube-link.schema';

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(bannerModule.name) private bannerModule: Model<bannerModule>,
    @InjectModel(testModule.name) private testModule: Model<testModule>,
    @InjectModel(youtubeModule.name)
    private youtubeModule: Model<youtubeModule>,
    private s3UploadService: S3UploadService,
  ) {}

  async addBanner(createBanner: createBannerDto, file: Express.Multer.File) {
    const imageUrl = await this.s3UploadService.uploadFile(file, 'banner');
    createBanner.image = imageUrl;

    if (createBanner.testId) {
      const test = await this.testModule.findById(createBanner.testId);

      if (!test) {
        throw new NotAcceptableException('test not found');
      }
    }

    const banner = await this.bannerModule.create(createBanner);

    return {
      message: 'Banner created successfully',
      data: banner,
      success: true,
    };
  }

  async fetchAllBanners() {
    return {
      message: 'Banners fetched successfully',
      data: await this.bannerModule.find(),
      success: true,
    };
  }

  async deleteBanner(id: string) {
    const banner = await this.bannerModule.findByIdAndDelete(id);

    if (!banner) {
      throw new NotFoundException('Banner not found, please enter correct ID');
    }

    return {
      message: 'Banner deleted successfully',
      success: true,
    };
  }

  async createYoutubeLink(createYoutubeLinkDto: createYoutubeLinkDto) {
    const existingLink = await this.youtubeModule.findOne({});
    let youtube;
    if (existingLink) {
      youtube = await this.youtubeModule.findByIdAndUpdate(
        existingLink._id,
        createYoutubeLinkDto,
        { new: true },
      );
    } else {
      youtube = await this.youtubeModule.create(createYoutubeLinkDto);
    }

    return {
      message: 'Youtube link saved successfully',
      data: youtube,
      success: true,
    };
  }

  async fetchAllYoutubeLinks() {
    return {
      message: 'Youtube links fetched successfully',
      data: await this.youtubeModule.find(),
      success: true,
    };
  }
}
