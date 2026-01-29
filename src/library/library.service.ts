import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { libraryModule } from './library.schema';
import { Model, Types } from 'mongoose';
import { authModule } from 'src/users/users.schema';
import { sectionModule } from 'src/section/section.schema';
import { questionModule } from 'src/question/question.schema';
import { addLibraryDto } from './library.dto';

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(libraryModule.name)
    private libraryModule: Model<libraryModule>,
    @InjectModel(authModule.name) private authModule: Model<authModule>,
    @InjectModel(sectionModule.name)
    private sectionModule: Model<sectionModule>,
    @InjectModel(questionModule.name)
    private questionModule: Model<questionModule>,
  ) {}

  async addLibrary(id: string, addLibraryDto: addLibraryDto) {
    const user = await this.authModule.findById(id);

    if (!user) {
      throw new NotAcceptableException('user not found, please signup.');
    }

    const section = await this.sectionModule.findById(addLibraryDto.sectionId);

    if (!section) {
      throw new NotAcceptableException(
        'section not found, please enter correct ID.',
      );
    }

    const question = await this.questionModule.findById(
      addLibraryDto.questionId,
    );

    if (!question) {
      throw new NotAcceptableException(
        'question not found, please enter correct ID.',
      );
    }

    const existingBookmark = await this.libraryModule.findOne({
      user: user._id,
      section: addLibraryDto.sectionId,
      question: addLibraryDto.questionId,
    });

    if (existingBookmark) {
      await this.libraryModule.deleteOne({ _id: existingBookmark._id });

      return {
        message: 'Question removed from library successfully',
        success: true,
        data: null,
      };
    }

    const library = await this.libraryModule.create({
      user,
      section: addLibraryDto.sectionId,
      question: addLibraryDto.questionId,
    });

    return {
      message: 'Question added to library successful',
      data: library,
      success: true,
    };
  }

  async fetchUserLibrary(id: string) {
    const user = await this.authModule.findById(id);

    if (!user) {
      throw new NotAcceptableException('user not found, please signup.');
    }

    const findLibrary = await this.libraryModule.findOne({ user: id });

    if (!findLibrary) {
      throw new NotAcceptableException('User have not added any library yet.');
    }

    const library = await this.libraryModule
      .findOne({ user: id })
      .populate('section question')
      .exec();

    return {
      message: 'Library fetched successfully',
      data: library,
      success: true,
    };
  }

  async getUserLibraryWithSections(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const data = await this.libraryModule.aggregate([
      {
        $match: { user: userObjectId },
      },
      {
        $lookup: {
          from: 'sectionmodules',
          localField: 'section',
          foreignField: '_id',
          as: 'sectionData',
        },
      },
      {
        $unwind: '$sectionData',
      },
      {
        $group: {
          _id: '$section',
          sectionName: { $first: '$sectionData.name' },
          sectionName_hi: { $first: '$sectionData.name_hi' },
          questionCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          sectionId: '$_id',
          sectionName: 1,
          sectionName_hi: 1,
          questionCount: 1,
        },
      },
    ]);

    return {
      success: true,
      message: 'User library fetched successfully',
      data,
    };
  }

  async getUserQuestionsBySection(userId: string, sectionId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const sectionObjectId = new Types.ObjectId(sectionId);

    const data = await this.libraryModule.aggregate([
      {
        $match: {
          user: userObjectId,
          section: sectionObjectId,
        },
      },
      {
        $lookup: {
          from: 'questionmodules',
          localField: 'question',
          foreignField: '_id',
          as: 'questionData',
        },
      },
      {
        $unwind: '$questionData',
      },
      {
        $lookup: {
          from: 'testmodules',
          let: { sectionId: '$section' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$$sectionId', '$sections'] },
              },
            },
            {
              $project: { _id: 1, title: 1, title_hi: 1 },
            },
          ],
          as: 'testData',
        },
      },
      {
        $project: {
          _id: 0,
          questionId: '$questionData._id',
          text: '$questionData.text',
          text_hi: '$questionData.text_hi',
          image: '$questionData.image',
          options: '$questionData.options',
          options_hi: '$questionData.options_hi',
          correctAnswers: '$questionData.correctAnswers',
          correctAnswers_hi: '$questionData.correctAnswers_hi',
          marks: '$questionData.marks',
          negativeMarks: '$questionData.negativeMarks',
          isTwoOptions: '$questionData.isTwoOptions',
          topic: '$questionData.topic',
          subject: '$questionData.subject',
          class: '$questionData.class',
          Exams: '$questionData.Exams',
          solution: '$questionData.solution',
          testTitles: {
            $map: {
              input: '$testData',
              as: 'test',
              in: {
                title: '$$test.title',
                title_hi: '$$test.title_hi',
              },
            },
          },
        },
      },
    ]);

    return {
      success: true,
      message: 'Questions fetched successfully for the given section and user',
      data,
    };
  }
}
