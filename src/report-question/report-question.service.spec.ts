import { Test, TestingModule } from '@nestjs/testing';
import { ReportQuestionService } from './report-question.service';

describe('ReportQuestionService', () => {
  let service: ReportQuestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportQuestionService],
    }).compile();

    service = module.get<ReportQuestionService>(ReportQuestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
