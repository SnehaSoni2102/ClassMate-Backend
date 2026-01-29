import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { questionModule } from './question.schema';
import mongoose, { Model } from 'mongoose';
import { sectionModule } from 'src/section/section.schema';
import {
  addQuestionAdminDto,
  addQuestionDto,
  addQuestionGroupAdminDto,
  updateQuestionByIdDto,
  updateQuestionDto,
} from './question.dto';
import { S3UploadService } from 'utils/s3Uploader';
import * as fs from 'fs';
// import * as csv from 'csv-parser';
import csv from 'csv-parser';
import { testModule } from 'src/test/test.schema';
import { topicModule } from 'src/topic/topic.schema';
import { subjectModule } from 'src/subject/subject.schema';
import { examModule } from 'src/exam/exam.schema';
import { classModule } from 'src/class/class.schema';
import { libraryModule } from 'src/library/library.schema';
import { reportQuestionModule } from 'src/report-question/report-question.schema';
import { userTestAttemptModule } from 'src/user-test-attempt/user-test-attempt.schema';
import { groupModule } from 'src/group/group.schema';
import { Counter } from './question.schema';

@Injectable()
export class QuestionService {
  constructor(
    @InjectModel(questionModule.name)
    private questionModule: Model<questionModule>,
    @InjectModel(sectionModule.name)
    private sectionModule: Model<sectionModule>,
    private s3UploadService: S3UploadService,
    @InjectModel(testModule.name) private testModule: Model<testModule>,
    @InjectModel(topicModule.name) private topicModule: Model<topicModule>,
    @InjectModel(subjectModule.name)
    private subjectModule: Model<subjectModule>,
    @InjectModel(examModule.name) private examModule: Model<examModule>,
    @InjectModel(classModule.name) private classModule: Model<classModule>,
    @InjectModel(libraryModule.name)
    private libraryModule: Model<libraryModule>,
    @InjectModel(reportQuestionModule.name)
    private reportQuestionModule: Model<reportQuestionModule>,
    @InjectModel(userTestAttemptModule.name)
    private userTestAttemptModule: Model<userTestAttemptModule>,
    @InjectModel(groupModule.name)
    private groupModule: Model<groupModule>,
    @InjectModel(Counter.name)
    private counterModule: Model<Counter>,
  ) {}

  async getUploadUrl(contentType: string) {
    return this.s3UploadService.getPresignedUrl('questions', contentType);
  }

  private async getNextSerialNumber(): Promise<number> {
    const result = await this.counterModule.findByIdAndUpdate(
      { _id: 'questionSerialNo' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    return result.seq;
  }

  async addQuestions(addQuestionDto: addQuestionDto) {
    const section = await this.sectionModule.findById(addQuestionDto.sectionId);

    if (!section) {
      throw new NotFoundException('section not found, please enter correct ID');
    }

    const serialNo = await this.getNextSerialNumber();
    const questionData = { ...addQuestionDto, serial_no: serialNo };
    const question = await this.questionModule.create(questionData);

    section.questions.push(question._id);
    await section.save();

    return {
      message: 'question added successfully',
      data: question,
    };
  }

  async fetchAllQuestions() {
    return {
      message: 'questions fetched successfully',
      data: await this.questionModule.find({
        $or: [{ groupId: { $exists: false } }, { groupId: null }],
      }),
      success: true,
    };
  }

  async fetchOneQuestion(id: string, userId: string) {
    const question = await this.questionModule.findById(id).lean();
    if (!question) throw new NotFoundException('Question not found');

    const sections = await this.sectionModule
      .find({ questions: id })
      .select('_id')
      .lean();
    const sectionIds = sections.map((s) => s._id);

    const tests = await this.testModule
      .find({ sections: { $in: sectionIds } })
      .select('title title_hi')
      .lean();

    const firstTest = tests[0] || { title: '', title_hi: '' };

    const isBookmarked = await this.libraryModule.exists({
      user: userId,
      question: id,
    });

    const cleanQuestion = {
      questionId: question._id.toString(),
      serial_no: question.serial_no,
      text: question.text,
      text_hi: question.text_hi,
      image: question.image,
      options: question.options,
      options_hi: question.options_hi,
      correctAnswers: question.correctAnswers,
      correctAnswers_hi: question.correctAnswers_hi,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      isTwoOptions: question.isTwoOptions ?? false,
      title: firstTest.title,
      title_hi: firstTest.title_hi,
      isBookMarkedByMe: !!isBookmarked,
    };

    return {
      message: 'Question fetched successfully',
      data: cleanQuestion,
      success: true,
    };
  }

  async updateQuestion(id: string, updateQuestionDto: updateQuestionDto) {
    const section = await this.sectionModule.findById(
      updateQuestionDto.sectionId,
    );

    if (!section) {
      throw new NotFoundException('section not found, please enter correct ID');
    }

    const update = await this.questionModule.findByIdAndUpdate(
      id,
      updateQuestionDto,
      { new: true },
    );

    return {
      message: 'Question updated successfully',
      data: update,
    };
  }

  async deleteQuestion(id: string) {
    const question = await this.questionModule.findByIdAndDelete(id);

    if (!question) {
      throw new NotFoundException(
        'question not found, please enter correct ID',
      );
    }

    await this.sectionModule.updateMany(
      { questions: id },
      { $pull: { questions: id } },
    );

    return {
      message: 'question deleted successfully',
    };
  }

  async addQuestionByAdmin(addQuestionAdminDto: addQuestionAdminDto) {
    const serialNo = await this.getNextSerialNumber();
    const questionData = { ...addQuestionAdminDto, serial_no: serialNo };
    const question = await this.questionModule.create(questionData);

    return {
      message: 'question added successfully',
      data: question,
      success: true,
    };
  }

  async updateQuestionById(
    questionId: string,
    updateDto: updateQuestionByIdDto,
  ) {
    const question = await this.questionModule.findById(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const fieldsToConvert = ['topics', 'subject', 'class', 'Exams'];
    fieldsToConvert.forEach((field) => {
      if (updateDto[field]) {
        updateDto[field] = updateDto[field].map(
          (id) => new mongoose.Types.ObjectId(id),
        );
      }
    });

    const updatedQuestion = await this.questionModule.findByIdAndUpdate(
      questionId,
      updateDto,
      { new: true },
    );

    return {
      message: 'Question updated successfully',
      data: updatedQuestion,
      success: true,
    };
  }

  async searchQuestions(
    searchTerm: string,
    questionType?: 'single' | 'multiple' | 'all',
    page = 1,
    limit = 10,
    filters?: {
      topicIds?: string[];
      subjectIds?: string[];
      classIds?: string[];
      examIds?: string[];
    },
  ) {
    const searchRegex = new RegExp(searchTerm, 'i');

    const skip = (page - 1) * limit;

    const filter: any = {
      $and: [
        { $or: [{ text: searchRegex }, { text_hi: searchRegex }] },
        { $or: [{ groupId: { $exists: false } }, { groupId: null }] },
      ],
    };

    if (questionType === 'multiple') {
      filter.isTwoOptions = true;
    } else if (questionType === 'single') {
      filter.isTwoOptions = false;
    }

    if (filters?.topicIds?.length) {
      filter.topics = { $in: filters.topicIds };
    }
    if (filters?.subjectIds?.length) {
      filter.subject = { $in: filters.subjectIds };
    }
    if (filters?.classIds?.length) {
      filter.class = { $in: filters.classIds };
    }
    if (filters?.examIds?.length) {
      filter.Exams = { $in: filters.examIds };
    }

    const total = await this.questionModule.countDocuments(filter);

    const questions = await this.questionModule
      .find(filter)
      .skip(skip)
      .limit(limit);

    return {
      message: 'Search results fetched successfully',
      data: {
        questions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async fetchQuestionsByAdmins() {
    return {
      message: 'questions fetched successfully',
      data: await this.questionModule
        .find()
        .populate('topics subject class Exams'),
      success: true,
    };
  }

  async fetchOneQuestionByAdmins(questionId: string) {
    const question = await this.questionModule
      .findById(questionId)
      .populate('topics subject class Exams');

    if (!question) {
      throw new NotFoundException('question not found');
    }

    return {
      message: 'question fetched successfully',
      data: question,
      success: true,
    };
  }

  async bulkUploadFromCsv(filePath: string): Promise<any> {
    const results: Record<string, any>[] = [];

    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);

      fileStream
        .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', async () => {
          try {
            for (const row of results) {
              const isEmpty = Object.values(row).every(
                (val) => !val || val.toString().trim() === '',
              );

              if (isEmpty) continue;

              const topicIds = await this.resolveOrCreate(
                row.topics?.split(',') || [],
                row.topics_hi?.split(',') || [],
                this.topicModule,
              );
              const subjectIds = await this.resolveOrCreate(
                row.subject?.split(',') || [],
                row.subject_hi?.split(',') || [],
                this.subjectModule,
              );
              const classIds = await this.resolveOrCreate(
                row.class?.split(',') || [],
                row.class_hi?.split(',') || [],
                this.classModule,
              );
              const examIds = await this.resolveOrCreate(
                row.Exams?.split('|').map((e) => e.trim()) || [],
                row.Exams_hi?.split('|').map((e) => e.trim()) || [],
                this.examModule,
              );

              const serialNo = await this.getNextSerialNumber();
              const questionData = {
                serial_no: serialNo,
                text: row.text?.trim() || '',
                text_hi: row.text_hi?.trim() || '',

                options: [
                  row.option_1?.trim(),
                  row.option_2?.trim(),
                  row.option_3?.trim(),
                  row.option_4?.trim(),
                ].filter(Boolean),

                options_hi: [
                  row.option_1_hi?.trim(),
                  row.option_2_hi?.trim(),
                  row.option_3_hi?.trim(),
                  row.option_4_hi?.trim(),
                ].filter(Boolean),

                correctAnswers:
                  row.correctAnswers?.split('|').map((ans) => ans.trim()) || [],
                correctAnswers_hi:
                  row.correctAnswers_hi?.split('|').map((ans) => ans.trim()) ||
                  [],

                marks: parseFloat(row.marks) || 0,
                negativeMarks: parseFloat(row.negativeMarks) || 0,
                isTwoOptions: row.isTwoOptions?.toLowerCase() === 'true',

                topics: topicIds,
                subject: subjectIds,
                class: classIds,
                Exams: examIds,

                solution: row.solution?.trim() || '',
                solution_hi: row.solution_hi?.trim() || '',
              };

              await this.questionModule.create(questionData);
            }

            fs.unlinkSync(filePath);
            resolve({
              message: 'Bulk upload successful',
              count: results.length,
            });
          } catch (err: any) {
            reject({ message: 'Bulk upload failed', error: err.message });
          }
        })
        .on('error', (error) => {
          reject({ message: 'CSV parsing error', error: error.message });
        });
    });
  }

  async bulkEditFromCsv(filePath: string): Promise<any> {
    const results: Record<string, any>[] = [];
    const updatedCount = { value: 0 };
    const errors: string[] = [];

    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);

      fileStream
        .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', async () => {
          try {
            for (const row of results) {
              const isEmpty = Object.values(row).every(
                (val) => !val || val.toString().trim() === '',
              );

              if (isEmpty) continue;

              const serialNo = parseInt(row.serial_no);
              if (!serialNo || isNaN(serialNo)) {
                errors.push(`Invalid serial_no: ${row.serial_no}`);
                continue;
              }

              const existingQuestion = await this.questionModule.findOne({
                serial_no: serialNo,
              });

              if (!existingQuestion) {
                errors.push(`Question with serial_no ${serialNo} not found`);
                continue;
              }

              const topicIds = row.topics
                ? await this.resolveOrCreate(
                    row.topics?.split(',') || [],
                    row.topics_hi?.split(',') || [],
                    this.topicModule,
                  )
                : existingQuestion.topics;

              const subjectIds = row.subject
                ? await this.resolveOrCreate(
                    row.subject?.split(',') || [],
                    row.subject_hi?.split(',') || [],
                    this.subjectModule,
                  )
                : existingQuestion.subject;

              const classIds = row.class
                ? await this.resolveOrCreate(
                    row.class?.split(',') || [],
                    row.class_hi?.split(',') || [],
                    this.classModule,
                  )
                : existingQuestion.class;

              const examIds = row.Exams
                ? await this.resolveOrCreate(
                    row.Exams?.split('|').map((e) => e.trim()) || [],
                    row.Exams_hi?.split('|').map((e) => e.trim()) || [],
                    this.examModule,
                  )
                : existingQuestion.Exams;

              const updateData: any = {};

              if (row.text !== undefined) updateData.text = row.text?.trim() || '';
              if (row.text_hi !== undefined) updateData.text_hi = row.text_hi?.trim() || '';

              if (row.option_1 !== undefined || row.option_2 !== undefined ||
                  row.option_3 !== undefined || row.option_4 !== undefined) {
                updateData.options = [
                  row.option_1?.trim(),
                  row.option_2?.trim(),
                  row.option_3?.trim(),
                  row.option_4?.trim(),
                ].filter(Boolean);
              }

              if (row.option_1_hi !== undefined || row.option_2_hi !== undefined ||
                  row.option_3_hi !== undefined || row.option_4_hi !== undefined) {
                updateData.options_hi = [
                  row.option_1_hi?.trim(),
                  row.option_2_hi?.trim(),
                  row.option_3_hi?.trim(),
                  row.option_4_hi?.trim(),
                ].filter(Boolean);
              }

              if (row.correctAnswers !== undefined) {
                updateData.correctAnswers = row.correctAnswers?.split('|').map((ans) => ans.trim()) || [];
              }

              if (row.correctAnswers_hi !== undefined) {
                updateData.correctAnswers_hi = row.correctAnswers_hi?.split('|').map((ans) => ans.trim()) || [];
              }

              if (row.marks !== undefined) updateData.marks = parseFloat(row.marks) || 0;
              if (row.negativeMarks !== undefined) updateData.negativeMarks = parseFloat(row.negativeMarks) || 0;
              if (row.isTwoOptions !== undefined) updateData.isTwoOptions = row.isTwoOptions?.toLowerCase() === 'true';

              if (row.topics !== undefined) updateData.topics = topicIds;
              if (row.subject !== undefined) updateData.subject = subjectIds;
              if (row.class !== undefined) updateData.class = classIds;
              if (row.Exams !== undefined) updateData.Exams = examIds;

              if (row.solution !== undefined) updateData.solution = row.solution?.trim() || '';
              if (row.solution_hi !== undefined) updateData.solution_hi = row.solution_hi?.trim() || '';

              await this.questionModule.findByIdAndUpdate(existingQuestion._id, updateData);
              updatedCount.value++;
            }

            fs.unlinkSync(filePath);
            resolve({
              message: 'Bulk edit completed',
              updated: updatedCount.value,
              errors: errors.length > 0 ? errors : undefined,
            });
          } catch (err: any) {
            reject({ message: 'Bulk edit failed', error: err.message });
          }
        })
        .on('error', (error) => {
          reject({ message: 'CSV parsing error', error: error.message });
        });
    });
  }

  private async resolveOrCreate(
    names: string[],
    names_hi: string[],
    model: Model<any>,
  ): Promise<string[]> {
    if (!names || !Array.isArray(names)) return [];
    const ids: string[] = [];
    const maxLen = Math.max(names?.length || 0, names_hi?.length || 0);

    for (let i = 0; i < maxLen; i++) {
      const name = names[i]?.trim();
      const name_hi = names_hi[i]?.trim() || name;

      if (!name && !name_hi) continue;

      let existing = await model.findOne({ name });

      if (existing) {
        ids.push(existing._id);
      } else {
        const created = await model.create({ name, name_hi });
        ids.push(created._id);
      }
    }

    return ids;
  }


  async bulkDeleteQuestions(questionIds: string[]) {
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      throw new BadRequestException('questionIds array is required and cannot be empty');
    }

    // Validate that all IDs are valid MongoDB ObjectIds
    const validObjectIds = questionIds.filter(id => {
      try {
        return id && typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
      } catch {
        return false;
      }
    });

    if (validObjectIds.length === 0) {
      throw new BadRequestException('No valid question IDs provided. IDs must be valid MongoDB ObjectIds (24-character hexadecimal strings)');
    }

    // Find existing questions to avoid errors for non-existent IDs
    const existingQuestions = await this.questionModule.find({
      _id: { $in: validObjectIds }
    }).select('_id').lean();

    const validIds = existingQuestions.map(q => q._id.toString());

    if (validIds.length === 0) {
      return {
        message: 'No valid questions found to delete',
        deletedCount: 0,
        success: true,
      };
    }

    // Bulk delete operations
    const deleteOperations = [
      // Delete related report questions
      this.reportQuestionModule.deleteMany({ question: { $in: validIds } }),

      // Delete related library entries
      this.libraryModule.deleteMany({ question: { $in: validIds } }),

      // Remove questions from sections
      this.sectionModule.updateMany(
        { questions: { $in: validIds } },
        { $pull: { questions: { $in: validIds } } }
      ),

      // Remove questions from user test attempts
      this.userTestAttemptModule.updateMany(
        { 'answers.questionId': { $in: validIds } },
        { $pull: { answers: { questionId: { $in: validIds } } } }
      ),

      // Delete the questions themselves
      this.questionModule.deleteMany({ _id: { $in: validIds } })
    ];

    // Execute all delete operations in parallel
    await Promise.all(deleteOperations);

    return {
      message: `${validIds.length} question(s) and related data deleted successfully`,
      deletedCount: validIds.length,
      success: true,
    };
  }

  async deleteQuestionById(id: string) {
    const question = await this.questionModule.findById(id);

    if (!question) {
      throw new NotFoundException(
        'question not found, please enter correct ID',
      );
    }

    await this.reportQuestionModule.deleteMany({ question: id });

    await this.libraryModule.deleteMany({ question: id });

    await this.sectionModule.updateMany(
      { questions: id },
      { $pull: { questions: id } },
    );

    await this.userTestAttemptModule.updateMany(
      { 'answers.questionId': id },
      { $pull: { answers: { questionId: id } } },
    );

    await this.questionModule.findByIdAndDelete(id);

    return {
      message: 'Question and related data deleted successfully',
      success: true,
    };
  }
}
