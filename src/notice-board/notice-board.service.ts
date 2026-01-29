import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { noticeBoardModule } from './notice-board.schema';
import { Model } from 'mongoose';
import { authModule } from 'src/users/users.schema';
import { createNoticeBoardDto, updateNoticeDto } from './notice-board.dto';

@Injectable()
export class NoticeBoardService {
  constructor(
    @InjectModel(noticeBoardModule.name)
    private noticeBoardModule: Model<noticeBoardModule>,
    @InjectModel(authModule.name)
    private authModule: Model<authModule>,
  ) {}

  async addNotice(id: string, addNoticeBoardDto: createNoticeBoardDto) {
    const user = await this.authModule.findById(id);

    if (!user) {
      throw new NotFoundException('user not found, please signup.');
    }

    const notice = await this.noticeBoardModule.create({
      user,
      ...addNoticeBoardDto,
    });

    return {
      message: 'Notice board added successfully',
      data: notice,
      success: true,
    };
  }

  async fetchAllNotice() {
    const notice = await this.noticeBoardModule.find();

    return {
      message: 'Notice Board fetched successfully',
      data: notice,
      success: true,
    };
  }

  async fetchOneNotice(id: string) {
    const notice = await this.noticeBoardModule.findById(id);

    return {
      message: 'Notice fetched successfully',
      data: notice,
      success: true,
    };
  }

  async updateNotice(id: string, updateNoticeDto: updateNoticeDto) {
    const notice = await this.noticeBoardModule.findByIdAndUpdate(
      id,
      updateNoticeDto,
      { new: true },
    );

    if (!notice) {
      throw new NotFoundException('notice not found, please enter correct ID.');
    }

    return {
      message: 'Notice updated successfully',
      data: notice,
      success: true,
    };
  }

  async deleteNotice(id: string) {
    const notice = await this.noticeBoardModule.findByIdAndDelete(id);

    if (!notice) {
      throw new NotFoundException('notice not found, please enter correct ID.');
    }

    return {
      message: 'notice deleted successfully',
      success: true,
    };
  }
}
