import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { authModule, authSchema } from 'src/users/users.schema';
import { sectionModule, sectionSchema } from './section.schema';
import { testModule, testSchema } from 'src/test/test.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';
import { questionModule, questionSchema } from 'src/question/question.schema';

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
    MongooseModule.forFeature([{ name: authModule.name, schema: authSchema }]),
    MongooseModule.forFeature([
      { name: sectionModule.name, schema: sectionSchema },
    ]),
    MongooseModule.forFeature([
      { name: questionModule.name, schema: questionSchema },
    ]),
    MongooseModule.forFeature([{ name: testModule.name, schema: testSchema }]),
  ],
  providers: [SectionService, JwtStrategy],
  controllers: [SectionController],
})
export class SectionModule {}
