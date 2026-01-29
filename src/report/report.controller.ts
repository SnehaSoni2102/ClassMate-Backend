import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReportService } from './report.service';
import { JwtAuthGuard } from 'guards/jwt.guards';
import { Roles, UserRole } from 'utils/helper';
import { reportGroupDto } from './report.dto';

@ApiTags('REPORT-GROUP')
@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Post()
  @ApiOperation({ summary: 'report group by group member' })
  @ApiResponse({ status: 201, description: 'Reported group successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.SUPERADMIN)
  reportGroup(@Request() req, @Body() reportGroupDto: reportGroupDto) {
    return this.reportService.reportGroup(req.user._id, reportGroupDto);
  }
}
