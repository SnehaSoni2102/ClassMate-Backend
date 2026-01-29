import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TopicService } from './topic.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { addTopicDto, updateTopicDto } from './topic.dto';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';

@ApiTags('TOPIC')
@Controller('topic')
export class TopicController {
  constructor(private topicService: TopicService) {}

  @Post('add')
  @ApiOperation({
    summary: 'add topic to question | just topic saved in db if not questionID',
  })
  @ApiResponse({
    status: 200,
    description: 'topic added to question successfully',
    type: addTopicDto,
  })
  @ApiResponse({
    status: 200,
    description: 'topic added successfully',
    type: addTopicDto,
  })
  @ApiResponse({
    status: 404,
    description: 'question not found',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  addTopic(@Body() addTopicDto: addTopicDto) {
    return this.topicService.addTopic(addTopicDto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'search topic',
  })
  @ApiResponse({
    status: 200,
    description: 'topic searched successfully',
    type: addTopicDto,
  })
  @ApiResponse({
    status: 400,
    description: 'topic name is required',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  searchTopics(
    @Query('name') name: string,
    @Query('questionCount') questionCount: boolean,
  ) {
    return this.topicService.searchTopicsByName(name, questionCount);
  }

  @Patch('update/:id')
  @ApiOperation({
    summary: 'update topic',
  })
  @ApiResponse({
    status: 200,
    description: 'topic updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'topic not found',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateTopic(@Param('id') id: string, @Body() updateTopicDto: updateTopicDto) {
    return this.topicService.updateTopic(id, updateTopicDto);
  }

  @Delete('delete/:id')
  @ApiOperation({
    summary: 'delete topic',
  })
  @ApiResponse({
    status: 200,
    description: 'topic deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'topic not found',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  deleteTopic(@Param('id') id: string) {
    return this.topicService.deleteTopic(id);
  }

  @Get('one/:id')
  @ApiOperation({
    summary: 'fetch one topic',
  })
  @ApiResponse({
    status: 200,
    description: 'topic fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'topic not found',
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchOneTopic(@Param('id') id: string) {
    return this.topicService.fetchOneTopic(id);
  }
}
