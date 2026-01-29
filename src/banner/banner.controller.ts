import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BannerService } from './banner.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';
import { FileInterceptor } from '@nestjs/platform-express';
import { createBannerDto, createYoutubeLinkDto } from './banner.dto';

@ApiTags('BANNER')
@Controller('banner')
export class BannerController {
  constructor(private bannerService: BannerService) {}

  @Post('add')
  @ApiOperation({ summary: 'Add banner by super admin' })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth()
  addBanner(
    @Body() addBannerDto: createBannerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bannerService.addBanner(addBannerDto, file);
  }

  @Get('all')
  @ApiOperation({ summary: 'Add banner by super admin' })
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  // @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STUDENT)
  fetchAll() {
    return this.bannerService.fetchAllBanners();
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'delete banner by super admin' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN)
  deleteBanner(@Param('id') id: string) {
    return this.bannerService.deleteBanner(id);
  }

  @Post('youtube')
  @ApiOperation({ summary: 'Add youtube link by super admin' })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.SUPERADMIN)
  @ApiBearerAuth()
  addYoutubeLink(@Body() body: createYoutubeLinkDto) {
    return this.bannerService.createYoutubeLink(body);
  }

  @Get('youtube/all')
  @ApiOperation({ summary: 'Get all youtube links' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchAllYoutubeLinks() {
    return this.bannerService.fetchAllYoutubeLinks();
  }
}
