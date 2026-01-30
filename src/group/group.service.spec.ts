import { Test, TestingModule } from '@nestjs/testing';
import { expect, jest, describe, it, beforeEach } from '@jest/globals';
import { GroupService } from './group.service';
import { getModelToken } from '@nestjs/mongoose';
import { groupModule } from './group.schema';
import { authModule } from 'src/users/users.schema';
import { testModule } from 'src/test/test.schema';
import { userTestAttemptModule } from 'src/user-test-attempt/user-test-attempt.schema';
import { notificationModule } from 'src/notification/notification.schema';
import { sectionModule } from 'src/section/section.schema';
import { pricingPlansModule } from 'src/pricing/pricing.schema';
import { userSubscriptionModule } from 'src/user-subscription/user-subscription.schema';
import { S3UploadService } from 'utils/s3Uploader';
import mongoose from 'mongoose';

describe('GroupService', () => {
  let service: GroupService;
  let groupModel: any;

  const mockGroupModel = {
    aggregate: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    populate: jest.fn(),
  };

  const mockAuthModel = {};
  const mockTestModel = {};
  const mockUserTestAttemptModel = {};
  const mockNotificationModel = {};
  const mockSectionModel = {};
  const mockPricingModel = {};
  const mockUserSubscriptionModel = {};
  const mockS3Service = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        { provide: getModelToken(groupModule.name), useValue: mockGroupModel },
        { provide: getModelToken(authModule.name), useValue: mockAuthModel },
        { provide: getModelToken(testModule.name), useValue: mockTestModel },
        {
          provide: getModelToken(userTestAttemptModule.name),
          useValue: mockUserTestAttemptModel,
        },
        {
          provide: getModelToken(notificationModule.name),
          useValue: mockNotificationModel,
        },
        {
          provide: getModelToken(sectionModule.name),
          useValue: mockSectionModel,
        },
        {
          provide: getModelToken(pricingPlansModule.name),
          useValue: mockPricingModel,
        },
        {
          provide: getModelToken(userSubscriptionModule.name),
          useValue: mockUserSubscriptionModel,
        },
        { provide: S3UploadService, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
    groupModel = module.get(getModelToken(groupModule.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchAllGroupsWithType', () => {
    it('should call aggregate with correct pipeline and return mapped groups', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockGroups = [
        {
          _id: 'group1',
          title: 'Group 1',
          members: [
            { user: { _id: 'u1', profilePicture: 'p1' }, role: 'member' },
          ],
          joinRequests: [],
          latestTestDate: new Date(),
        },
        {
          _id: 'group2',
          title: 'Group 2',
          members: [],
          joinRequests: [new mongoose.Types.ObjectId(userId)],
          latestTestDate: new Date(Date.now() - 10000),
        },
      ];

      (mockGroupModel.exec as jest.Mock).mockResolvedValue(
        mockGroups as never,
      );
      (mockGroupModel.populate as jest.Mock).mockResolvedValue(
        mockGroups as never,
      );

      const result = await service.fetchAllGroupsWithType(userId);

      expect(mockGroupModel.aggregate).toHaveBeenCalled();
      const pipeline = mockGroupModel.aggregate.mock.calls[0][0];

      // Verify pipeline stages
      expect(pipeline).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ $match: expect.any(Object) }),
          expect.objectContaining({ $lookup: expect.any(Object) }),
          expect.objectContaining({ $addFields: expect.any(Object) }),
          expect.objectContaining({ $sort: { latestTestDate: -1 } }),
          expect.objectContaining({ $project: expect.any(Object) }),
        ]),
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('group1');
      expect(result.data[1].id).toBe('group2');
      expect(result.data[1].status).toBe('pending');
    });
  });
});
