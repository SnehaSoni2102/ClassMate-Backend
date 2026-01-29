import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { questionModule } from 'src/question/question.schema';
import { classModule } from './class.schema';
import { addClassDto, updateClassDto } from './class.dto';

@Injectable()
export class ClassService {
  constructor(
    @InjectModel(classModule.name)
    private classModule: Model<classModule>,
    @InjectModel(questionModule.name)
    private questionModule: Model<questionModule>,
  ) {}

  async addClass(addClassDto: addClassDto) {
    const className = addClassDto.name.trim();

    let classDoc = await this.classModule.findOne({
      name: { $regex: new RegExp(`^${className}$`, 'i') },
    });

    let isNewlyCreated = false;

    if (!classDoc) {
      classDoc = await this.classModule.create({ name: className });
      isNewlyCreated = true;
    }

    if (addClassDto.question) {
      const question = await this.questionModule.findById(addClassDto.question);

      if (!question) {
        throw new NotFoundException(
          'Question not found, please enter correct ID.',
        );
      }

      question.class = question.class ?? [];

      const alreadyLinked = question.class.some(
        (id) => id.toString() === classDoc._id.toString(),
      );

      if (!alreadyLinked) {
        question.class.push(classDoc._id);
        await question.save();

        return {
          message: isNewlyCreated
            ? 'Class created and linked to question.'
            : 'Existing class linked to question.',
          data: classDoc,
          success: true,
        };
      } else {
        return {
          message: 'Class already linked to this question.',
          data: classDoc,
          success: true,
        };
      }
    }

    return {
      message: isNewlyCreated ? 'Class created.' : 'Class already exists.',
      data: classDoc,
      success: true,
    };
  }

  async searchClassesByName(name: string, questionCount: boolean) {
    const regex = new RegExp(name, 'i');

    const classes = await this.classModule.find({ name: regex });

    const response: any = {
      message: 'class searched successfully',
      data: classes,
      success: true,
    };

    if (questionCount) {
      response.totalCount = classes.length;
    }
    return response;
  }

  async updateClass(id: string, updateDto: updateClassDto) {
    const cls = await this.classModule.findById(id);

    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    const updated = await this.classModule.findByIdAndUpdate(id, updateDto, {
      new: true,
    });

    return {
      message: 'Class updated successfully',
      data: updated,
      success: true,
    };
  }

  async deleteClass(id: string) {
    const cls = await this.classModule.findById(id);
    if (!cls) throw new NotFoundException('Class not found');

    await this.questionModule.updateMany(
      { class: id },
      { $pull: { class: id } },
    );

    await this.classModule.findByIdAndDelete(id);

    return {
      message: 'Class deleted and unlinked from all questions successfully',
      data: cls,
      success: true,
    };
  }

  async fetchOneClass(id: string) {
    const cls = await this.classModule.findById(id);

    if (!cls) {
      throw new NotFoundException('Class not found, please enter correct ID');
    }

    return {
      message: 'Class fetched successfully',
      data: cls,
      success: true,
    };
  }
}
