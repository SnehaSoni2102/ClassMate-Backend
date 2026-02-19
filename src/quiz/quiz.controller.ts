import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto, UpdateQuizDto } from './quiz.dto';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('QUIZ')
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a quiz' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async create(@Body() dto: CreateQuizDto, @Request() req) {
    const userId = req.user?._id;
    return this.quizService.create(dto, userId);
  }

  @Get('all')
  @ApiOperation({ summary: 'List quizzes' })
  async findAll() {
    return this.quizService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by id' })
  async findOne(@Param('id') id: string) {
    return this.quizService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update quiz' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.quizService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quiz' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async remove(@Param('id') id: string) {
    return this.quizService.remove(id);
  }
}

