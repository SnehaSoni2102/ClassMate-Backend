import { Test, TestingModule } from '@nestjs/testing';
import { ReportQuestionController } from './report-question.controller';

describe('ReportQuestionController', () => {
  let controller: ReportQuestionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportQuestionController],
    }).compile();

    controller = module.get<ReportQuestionController>(ReportQuestionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
