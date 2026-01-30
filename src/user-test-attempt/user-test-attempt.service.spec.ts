import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UserTestAttemptService } from './user-test-attempt.service';
import { getModelToken } from '@nestjs/mongoose';
import { userTestAttemptModule } from './user-test-attempt.schema';
import { authModule } from 'src/users/users.schema';
import { testModule } from 'src/test/test.schema';
import { questionModule } from 'src/question/question.schema';
import { libraryModule } from 'src/library/library.schema';
import { sectionModule } from 'src/section/section.schema';
import { notificationModule } from 'src/notification/notification.schema';
import { userSubscriptionModule } from 'src/user-subscription/user-subscription.schema';
import mongoose from 'mongoose';

describe('UserTestAttemptService', () => {
  let service: UserTestAttemptService;
  let userTestAttemptModel: any;
  let testModel: any;
  let sectionModel: any;
  let questionModel: any;
  let libraryModel: any;

  const mockUserTestAttemptModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
  };

  const mockTestModel = {
    findById: jest.fn(),
  };

  const mockSectionModel = {
    findById: jest.fn(),
  };

  const mockQuestionModel = {
    find: jest.fn(),
  };

  const mockLibraryModel = {
    find: jest.fn(),
  };

  const mockAuthModel = { findById: jest.fn() };
  const mockNotificationModel = { create: jest.fn() };
  const mockUserSubscriptionModel = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserTestAttemptService,
        {
          provide: getModelToken(userTestAttemptModule.name),
          useValue: mockUserTestAttemptModel,
        },
        { provide: getModelToken(authModule.name), useValue: mockAuthModel },
        { provide: getModelToken(testModule.name), useValue: mockTestModel },
        {
          provide: getModelToken(questionModule.name),
          useValue: mockQuestionModel,
        },
        {
          provide: getModelToken(libraryModule.name),
          useValue: mockLibraryModel,
        },
        {
          provide: getModelToken(sectionModule.name),
          useValue: mockSectionModel,
        },
        {
          provide: getModelToken(notificationModule.name),
          useValue: mockNotificationModel,
        },
        {
          provide: getModelToken(userSubscriptionModule.name),
          useValue: mockUserSubscriptionModel,
        },
      ],
    }).compile();

    service = module.get<UserTestAttemptService>(UserTestAttemptService);
    userTestAttemptModel = module.get(
      getModelToken(userTestAttemptModule.name),
    );
    testModel = module.get(getModelToken(testModule.name));
    sectionModel = module.get(getModelToken(sectionModule.name));
    questionModel = module.get(getModelToken(questionModule.name));
    libraryModel = module.get(getModelToken(libraryModule.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuestionsBySectionByTestId', () => {
    it('should return questions with correctAnswers and selectedAnswers', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const testId = new mongoose.Types.ObjectId().toString();
      const sectionId = new mongoose.Types.ObjectId().toString();
      const questionId = new mongoose.Types.ObjectId().toString();

      const mockAttempt = {
        answers: [
          {
            questionId: questionId,
            selectedAnswers: ['A'],
            timeTaken: 10,
          },
        ],
      };

      const mockTest = {
        sections: [{ _id: sectionId }],
      };

      const mockSection = {
        _id: sectionId,
        name: 'Section 1',
        questions: [questionId],
      };

      const mockQuestions = [
        {
          _id: questionId,
          text: 'Question 1',
          text_hi: 'Question 1 Hi',
          correctAnswers: ['A'],
          marks: 1,
          negativeMarks: 0,
        },
      ];

      (userTestAttemptModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: (jest.fn() as jest.Mock).mockResolvedValue(mockAttempt),
        }),
      });

      (testModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: (jest.fn() as jest.Mock).mockResolvedValue(mockTest),
        }),
      });

      (sectionModel.findById as jest.Mock).mockReturnValue({
        lean: (jest.fn() as jest.Mock).mockResolvedValue(mockSection),
      });

      (questionModel.find as jest.Mock).mockReturnValue({
        lean: (jest.fn() as jest.Mock).mockResolvedValue(mockQuestions),
      });

      (libraryModel.find as jest.Mock).mockReturnValue({
        lean: (jest.fn() as jest.Mock).mockResolvedValue([]),
      });

      const result = await service.getQuestionsBySectionByTestId(
        userId,
        testId,
        'all',
      );

      expect(result.data.sections).toHaveLength(1);
      expect(result.data.sections[0].questions).toHaveLength(1);
      const question = result.data.sections[0].questions[0];
      expect(question.questionId).toBe(questionId);
      expect((question as any).correctAnswers).toEqual(['A']);
      expect((question as any).selectedAnswers).toEqual(['A']);
    });
  });
});
