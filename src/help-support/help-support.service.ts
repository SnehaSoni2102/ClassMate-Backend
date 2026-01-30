import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { helpSupportModule } from './help-support.schema';
import { Model } from 'mongoose';
import { authModule } from 'src/users/users.schema';
import { submitQueryDto } from './help-support.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class HelpSupportService {
  constructor(
    @InjectModel(helpSupportModule.name)
    private helpSupportModule: Model<helpSupportModule>,
    @InjectModel(authModule.name) private authModule: Model<authModule>,
    private jwtService: JwtService,
  ) {}

  async submitQuery(id: string, submitQueryDto: submitQueryDto) {
    const user = await this.authModule.findById(id);

    if (!user) {
      throw new NotFoundException('user not found, please signup.');
    }

    const query = await this.helpSupportModule.create({
      user,
      ...submitQueryDto,
    });

    return {
      message: 'query submitted successfully!',
      data: query,
    };
  }

  async fetchAllQueries() {
    const query = await this.helpSupportModule
      .find()
      .populate('user')
      .sort('ascending');

    return {
      message: 'queries fetched successfully',
      data: query,
    };
  }
}
