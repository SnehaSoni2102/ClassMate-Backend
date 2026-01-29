import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { HelpSupportService } from './help-support.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { submitQueryDto } from './help-support.dto';
import { SubmitQueryResponseDto } from 'responseDTOs/swaggerResponse.dto';

@ApiTags('HELP-SUPPORT')
@Controller('help-support')
export class HelpSupportController {
  constructor(private helpSupportService: HelpSupportService) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit query' })
  @ApiResponse({
    status: 200,
    description: 'Query Submitted successfully',
    type: SubmitQueryResponseDto,
  })
  @ApiNotFoundResponse({ description: 'user not found!' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  submitQuery(@Request() req, @Body() submitQueryDto: submitQueryDto) {
    const id = req.user._id;
    return this.helpSupportService.submitQuery(id, submitQueryDto);
  }

  @Get('fetch-query')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'fetch queries by admin and superadmin' })
  @ApiResponse({
    status: 200,
    description: 'Query fetched successfully',
    type: SubmitQueryResponseDto,
  })
  @ApiNotFoundResponse({ description: 'user not found!' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  fetchQueries() {
    return this.helpSupportService.fetchAllQueries();
  }
}
