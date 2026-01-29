import { Test, TestingModule } from '@nestjs/testing';
import { UserSubscriptionService } from './user-subscription.service';

describe('UserSubscriptionService', () => {
  let service: UserSubscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSubscriptionService],
    }).compile();

    service = module.get<UserSubscriptionService>(UserSubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
