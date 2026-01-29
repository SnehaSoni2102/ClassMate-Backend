import { Test, TestingModule } from '@nestjs/testing';
import { NoticeBoardController } from './notice-board.controller';

describe('NoticeBoardController', () => {
  let controller: NoticeBoardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoticeBoardController],
    }).compile();

    controller = module.get<NoticeBoardController>(NoticeBoardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
