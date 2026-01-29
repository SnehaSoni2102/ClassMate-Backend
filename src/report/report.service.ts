import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { reportGroupModule } from './report.schema';
import { Model } from 'mongoose';
import { groupModule } from 'src/group/group.schema';
import { authModule } from 'src/users/users.schema';
import { reportGroupDto } from './report.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(reportGroupModule.name)
    private reportGroupModule: Model<reportGroupModule>,
    @InjectModel(groupModule.name)
    private groupModule: Model<groupModule>,
    @InjectModel(authModule.name)
    private authModule: Model<authModule>,
  ) {}

  async reportGroup(userId: string, reportGroupDto: reportGroupDto) {
    const group = await this.groupModule
      .findById(reportGroupDto.group)
      .populate('members');

    if (!group) {
      throw new NotFoundException('group not found, please enter correct ID');
    }

    const user = await this.authModule.findById(userId);

    if (!user) {
      throw new NotFoundException('user not found, please signup.');
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === userId.toString(),
    );

    if (!isMember) {
      throw new NotFoundException('user is not a member of group');
    }

    const report = await this.reportGroupModule.create({
      user: user._id,
      group: group._id,
      description: reportGroupDto.description,
    });

    return {
      message: 'Group reported successfully',
      data: report,
      success: true,
    };
  }
}
