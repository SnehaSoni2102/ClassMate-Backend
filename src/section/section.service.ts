import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { sectionModule } from './section.schema';
import { Model } from 'mongoose';
import { authModule } from 'src/users/users.schema';
import { testModule } from 'src/test/test.schema';
import {
  addQuestionToSectionByIdDto,
  createSectionDto,
  updateSectionDto,
} from './section.dto';
import { questionModule } from 'src/question/question.schema';

@Injectable()
export class SectionService {
  constructor(
    @InjectModel(sectionModule.name)
    private sectionModule: Model<sectionModule>,
    @InjectModel(authModule.name) private authModule: Model<authModule>,
    @InjectModel(testModule.name) private testModule: Model<testModule>,
    @InjectModel(questionModule.name)
    private questionModule: Model<questionModule>,
  ) {}

  async createSection(id: string, createSectionDto: createSectionDto) {
    const user = await this.authModule.findById(id);

    if (!user) {
      throw new NotFoundException('user not found, please signup.');
    }

    const test = await this.testModule.findById(createSectionDto.testId);

    if (!test) {
      throw new NotFoundException('test not found, please enter correct ID');
    }

    const section = await this.sectionModule.create({
      user: user._id,
      ...createSectionDto,
    });

    test.sections.push(section._id);
    await test.save();

    return {
      message: 'section added to test successfully',
      data: section,
    };
  }

  async fetchAllSections() {
    return {
      message: 'Sections Fetched Successfully',
      data: await this.sectionModule.find().populate('questions').exec(),
    };
  }

  async fetchSection(id: string, lang: 'en' | 'hi') {
    const section = await this.sectionModule
      .findById(id)
      .populate('questions')
      .exec();

    if (!section) {
      throw new NotFoundException('section not found, please enter correct ID');
    }

    const filteredSection = {
      _id: section._id,
      name: lang === 'hi' ? section.name_hi : section.name,
      order: section.order,
      timeLimit: section.timeLimit,
      questions: section.questions.map((q: any) => ({
        _id: q._id,
        image: q.image,
        question: lang === 'hi' ? q.text_hi : q.text,
        options: lang === 'hi' ? q.options_hi : q.options,
        correctAnswers: lang === 'hi' ? q.correctAnswers_hi : q.correctAnswers,
        positiveMarking: q.marks,
        negativeMarking: q.negativeMarks,
        multipleSelection: q.isTwoOptions,
      })),
    };

    return {
      message: 'section fetched successfully',
      data: filteredSection,
    };
  }

  async updateSection(updateSectionDto: updateSectionDto) {
    const section = await this.sectionModule.findByIdAndUpdate(
      updateSectionDto.testId,
      updateSectionDto,
      { new: true },
    );

    if (!section) {
      throw new NotFoundException('section not found.');
    }

    return {
      message: 'section updated successfully',
      data: section,
    };
  }

  async deleteSection(id: string) {
    const section = await this.sectionModule.findByIdAndDelete(id);

    if (!section) {
      throw new NotFoundException('section not found, please enter correct ID');
    }

    await this.testModule.updateMany(
      { sections: id },
      { $pull: { sections: id } },
    );

    return {
      message: 'section deleted successfully',
    };
  }

  async addQuestionToSection(
    id: string,
    sectionId: addQuestionToSectionByIdDto,
  ) {
    const question = await this.questionModule.findById(id);

    if (!question) {
      throw new NotFoundException(
        'question not found, please enter correct ID',
      );
    }

    const section = await this.sectionModule.findById(sectionId.sectionId);

    if (!section) {
      throw new NotFoundException('section not found, please enter correct ID');
    }

    section.questions.push(question._id);
    await section.save();

    return {
      message: 'question added to section',
      data: section,
      success: true,
    };
  }
}
