import { Test, TestingModule } from '@nestjs/testing';
import { NoticeBoardService } from './notice-board.service';

describe('NoticeBoardService', () => {
  let service: NoticeBoardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NoticeBoardService],
    }).compile();

    service = module.get<NoticeBoardService>(NoticeBoardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
