import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { subjectModule } from './subject.schema';
import { Model } from 'mongoose';
import { addSubjectDto, updateSubjectDto } from './subject.dto';
import { questionModule } from 'src/question/question.schema';

@Injectable()
export class SubjectService {
  constructor(
    @InjectModel(subjectModule.name)
    private subjectModule: Model<subjectModule>,
    @InjectModel(questionModule.name)
    private questionModule: Model<questionModule>,
  ) {}

  async addSubject(addSubjectDto: addSubjectDto) {
    const subjectName = addSubjectDto.name.trim();

    let subject = await this.subjectModule.findOne({
      name: { $regex: new RegExp(`^${subjectName}$`, 'i') },
    });

    let isNewlyCreated = false;

    if (!subject) {
      subject = await this.subjectModule.create({
        name: subjectName,
        name_hi: addSubjectDto.name_hi,
      });
      isNewlyCreated = true;
    }

    if (addSubjectDto.question) {
      const question = await this.questionModule.findById(
        addSubjectDto.question,
      );

      if (!question) {
        throw new NotFoundException(
          'Question not found, please enter correct ID.',
        );
      }

      question.subject = question.subject ?? [];

      const alreadyLinked = question.subject.some(
        (id) => id.toString() === subject._id.toString(),
      );

      if (!alreadyLinked) {
        question.subject.push(subject._id);
        await question.save();

        return {
          message: isNewlyCreated
            ? 'Subject created and linked to question.'
            : 'Existing subject linked to question.',
          data: subject,
          success: true,
        };
      } else {
        return {
          message: 'Subject already linked to this question.',
          data: subject,
          success: true,
        };
      }
    }

    return {
      message: isNewlyCreated ? 'Subject created.' : 'Subject already exists.',
      data: subject,
      success: true,
    };
  }

  async searchSubjectssByName(name: string, questionCount: boolean) {
    const regex = new RegExp(name, 'i');

    const subject = await this.subjectModule.find({ name: regex });

    const response: any = {
      message: 'subject searched successfully',
      data: subject,
      success: true,
    };

    if (questionCount) {
      response.totalCount = subject.length;
    }
    return response;
  }

  async updateSubject(id: string, updateDto: updateSubjectDto) {
    const updatedSubject = await this.subjectModule.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true },
    );

    if (!updatedSubject) {
      throw new NotFoundException('Subject not found');
    }

    return {
      message: 'Subject updated successfully.',
      data: updatedSubject,
      success: true,
    };
  }

  async deleteSubject(id: string) {
    const subject = await this.subjectModule.findById(id);

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    await this.questionModule.updateMany(
      { subject: id },
      { $pull: { subject: id } },
    );

    await this.subjectModule.findByIdAndDelete(id);

    return {
      message: 'Subject deleted and unlinked from all questions successfully.',
      data: subject,
      success: true,
    };
  }

  async fetchOneSubject(id: string) {
    const subject = await this.subjectModule.findById(id);

    if (!subject) {
      throw new NotFoundException('Subject not found, please enter correct ID');
    }

    return {
      message: 'Subject fetched successfully',
      data: subject,
      success: true,
    };
  }
}
