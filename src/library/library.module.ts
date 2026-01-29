import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { authModule, authSchema } from 'src/users/users.schema';
import { libraryModule, librarySchema } from './library.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { questionModule, questionSchema } from 'src/question/question.schema';
import { sectionModule, sectionSchema } from 'src/section/section.schema';

@Module({
  imports: [
    PassportModule,
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1y' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: libraryModule.name, schema: librarySchema },
      { name: authModule.name, schema: authSchema },

      { name: questionModule.name, schema: questionSchema },
      { name: sectionModule.name, schema: sectionSchema },
    ]),
  ],
  providers: [LibraryService, JwtStrategy],
  controllers: [LibraryController],
})
export class LibraryModule {}
