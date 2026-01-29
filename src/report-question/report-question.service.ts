import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { reportQuestionModule } from './report-question.schema';
import { Model } from 'mongoose';
import { authModule } from 'src/users/users.schema';
import {
  reportQuestionDto,
  updateStatusOfReportedQuestionDto,
} from './report-question.dto';
import { questionModule } from 'src/question/question.schema';

@Injectable()
export class ReportQuestionService {
  constructor(
    @InjectModel(reportQuestionModule.name)
    private reportQuestionModule: Model<reportQuestionModule>,
    @InjectModel(authModule.name) private authModule: Model<authModule>,
    @InjectModel(questionModule.name)
    private questionModule: Model<questionModule>,
  ) {}

  async reportQuestion(id: string, reportQuestionDto: reportQuestionDto) {
    const user = await this.authModule.findById(id);

    if (!user) {
      throw new NotAcceptableException('user not found, please signup.');
    }

    const question = await this.questionModule.findById(
      reportQuestionDto.question,
    );

    if (!question) {
      throw new NotAcceptableException(
        'question not found, please enter correct ID',
      );
    }

    const report = await this.reportQuestionModule.create({
      user: user,
      ...reportQuestionDto,
    });

    return {
      message: 'question reported successfully',
      data: report,
    };
  }

  async fetchAllReportedQuestions() {
    const question = await this.reportQuestionModule
      .find()
      .populate('user')
      .exec();

    return {
      message: 'All Reported questions fetched successfully',
      data: question,
      success: true,
    };
  }

  async updateStatusOfQuestion(
    id: string,
    updateStatusOfReportedQuestionDto: updateStatusOfReportedQuestionDto,
  ) {
    const question = await this.reportQuestionModule.findByIdAndUpdate(
      id,
      { status: updateStatusOfReportedQuestionDto.status },
      { new: true },
    );

    if (!question) {
      throw new BadRequestException(
        'question not found, please enter correct id',
      );
    }

    return {
      message: 'Question status updated successfully',
      success: true,
    };
  }
}
