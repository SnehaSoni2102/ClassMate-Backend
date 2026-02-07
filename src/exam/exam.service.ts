import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { examModule } from './exam.schema';
import { testModule } from 'src/test/test.schema';
import { Model } from 'mongoose';
import { S3UploadService } from 'utils/s3Uploader';
import {
  addExamDto,
  addExamToQuestionsDto,
  fetchexamDto,
  updateExamDto,
} from './exam.dto';
import { categoryModule } from 'src/category/category.schema';
import { questionModule } from 'src/question/question.schema';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(examModule.name) private examModule: Model<examModule>,
    @InjectModel(testModule.name) private testModule: Model<testModule>,
    @InjectModel(categoryModule.name)
    private categoryModule: Model<categoryModule>,
    private s3UploadService: S3UploadService,
    @InjectModel(questionModule.name)
    private questionModule: Model<questionModule>,
  ) {}

  async addExam(addExamDto: addExamDto, file?: Express.Multer.File) {
    const category = await this.categoryModule.findById(addExamDto.categoryId);

    if (!category) {
      throw new NotFoundException(
        'category not found, please enter correct ID',
      );
    }

    const isParentCategory = await this.categoryModule.exists({
      parent: addExamDto.categoryId,
    });

    if (isParentCategory) {
      throw new BadRequestException(
        'This category is a parent of another category and cannot have exams.',
      );
    }

    if (file) {
      const imageUrl = await this.s3UploadService.uploadFile(file, 'logo');
      addExamDto.logo = imageUrl;
    }

    const exam = await this.examModule.create(addExamDto);

    category.exams.push(exam._id);

    await category.save();

    return {
      message: 'exam added successfully',
      data: exam,
      success: true,
    };
  }

  async fetchExams(fetchexamDto: fetchexamDto) {
    let exam;
    if (fetchexamDto.name) {
      exam = await this.examModule.find({
        name: { $regex: new RegExp(fetchexamDto.name, 'i') },
      });
    } else {
      exam = await this.examModule.find();
    }

    const response: any = {
      message: 'exams fetched successfully',
      data: exam,
      success: true,
    };

    if (fetchexamDto.questionCount) {
      response.totalCount = exam.length;
    }

    return response;
  }

  async addExamToQuestion(dto: addExamToQuestionsDto) {
    const question = await this.questionModule.findById(dto.question);
    if (!question) {
      throw new NotFoundException(
        'Question not found, please enter correct ID.',
      );
    }

    const exam = await this.examModule.findById(dto.exam);

    if (!exam) {
      throw new NotFoundException('exam not found, please enter correct ID.');
    }

    question.Exams = question.Exams ?? [];

    const alreadyLinked = question.Exams.some(
      (id) => id.toString() === dto.exam,
    );

    if (alreadyLinked) {
      throw new BadRequestException('Exam is already linked to this question.');
    }

    question.Exams.push(exam._id);
    await question.save();

    return {
      message: 'Exam linked to question successfully.',
      success: true,
      data: question,
    };
  }

  async updateExam(
    id: string,
    updateDto: updateExamDto,
    file?: Express.Multer.File,
  ) {
    const exam = await this.examModule.findById(id);
    if (!exam) throw new NotFoundException('Exam not found');

    if (file) {
      const imageUrl = await this.s3UploadService.uploadFile(file, 'exam-logo');
      updateDto.logo = imageUrl;
    }

    const updatedExam = await this.examModule.findByIdAndUpdate(id, updateDto, {
      new: true,
    });

    return {
      message: 'Exam updated successfully',
      data: updatedExam,
      success: true,
    };
  }

  async deleteExam(id: string) {
    const exam = await this.examModule.findById(id);

    if (!exam) throw new NotFoundException('Exam not found');

    await this.categoryModule.updateMany(
      { exams: id },
      { $pull: { exams: id } },
    );

    await this.questionModule.updateMany({ exam: id }, { $pull: { exam: id } });

    await this.examModule.findByIdAndDelete(id);

    return {
      message: 'Exam deleted and unlinked from all categories successfully',
      data: exam,
      success: true,
    };
  }

  async fetchOneExam(id: string) {
    const exam = await this.examModule.findById(id);
    const tests = await this.testModule.find({ exam: id });

    console.log(tests);

    if (!exam) {
      throw new NotFoundException('Exam not found, please enter correct ID');
    }

    return {
      message: 'Exam fetched successfully',
      data: exam,
      tests: tests,
      success: true,
    };
  }
}
