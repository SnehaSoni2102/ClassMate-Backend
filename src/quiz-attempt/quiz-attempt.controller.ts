import { Body, Controller, Post, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { QuizAttemptService } from './quiz-attempt.service';
import { SubmitQuizDto } from './quiz-attempt.dto';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('QUIZ-ATTEMPT')
@Controller('quiz-attempt')
export class QuizAttemptController {
  constructor(private svc: QuizAttemptService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit quiz answers' })
  @ApiBody({ type: SubmitQuizDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async submit(@Body() dto: SubmitQuizDto, @Request() req) {
    const userId = req.user._id;
    return this.svc.submit(userId, dto);
  }
}

