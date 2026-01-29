import { Module } from '@nestjs/common';
import { NoticeBoardService } from './notice-board.service';
import { NoticeBoardController } from './notice-board.controller';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { noticeBoardModule, noticeBoardSchema } from './notice-board.schema';
import { authModule, authSchema } from 'src/users/users.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: noticeBoardModule.name, schema: noticeBoardSchema },
    ]),
    MongooseModule.forFeature([{ name: authModule.name, schema: authSchema }]),
  ],
  providers: [NoticeBoardService, JwtStrategy],
  controllers: [NoticeBoardController],
})
export class NoticeBoardModule {}
