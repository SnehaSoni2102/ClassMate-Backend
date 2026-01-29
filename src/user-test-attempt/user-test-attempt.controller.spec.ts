import { Test, TestingModule } from '@nestjs/testing';
import { UserTestAttemptController } from './user-test-attempt.controller';

describe('UserTestAttemptController', () => {
  let controller: UserTestAttemptController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserTestAttemptController],
    }).compile();

    controller = module.get<UserTestAttemptController>(
      UserTestAttemptController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
