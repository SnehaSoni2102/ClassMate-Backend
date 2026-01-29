import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Home Route')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Home Route' })
  @ApiResponse({
    status: 200,
    example: 'Hello Welcome to Classmate Test Backend!',
    description: 'Hellow Welcome to Classmate Test Backend!',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
