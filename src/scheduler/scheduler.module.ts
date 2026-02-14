import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { MongooseModule } from '@nestjs/mongoose';
import { testModule, testSchema } from 'src/test/test.schema';
import { sectionModule, sectionSchema } from 'src/section/section.schema';
import { userTestAttemptModule, userTestAttemptSchema } from 'src/user-test-attempt/user-test-attempt.schema';
import { authModule, authSchema } from 'src/users/users.schema';
import { bannerModule, bannerSchema } from 'src/banner/banner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: testModule.name, schema: testSchema }]),
    MongooseModule.forFeature([{ name: sectionModule.name, schema: sectionSchema }]),
    MongooseModule.forFeature([
      { name: userTestAttemptModule.name, schema: userTestAttemptSchema },
    ]),
    MongooseModule.forFeature([{ name: authModule.name, schema: authSchema }]),
    MongooseModule.forFeature([{ name: bannerModule.name, schema: bannerSchema }]),
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}

