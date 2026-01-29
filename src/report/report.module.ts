import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { reportGroupModule, reportGroupSchema } from './report.schema';
import { groupModule, groupSchema } from 'src/group/group.schema';
import { authModule, authSchema } from 'src/users/users.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: reportGroupModule.name, schema: reportGroupSchema },
    ]),
    MongooseModule.forFeature([
      { name: groupModule.name, schema: groupSchema },
    ]),
    MongooseModule.forFeature([{ name: authModule.name, schema: authSchema }]),
  ],
  providers: [ReportService],
  controllers: [ReportController],
})
export class ReportModule {}
