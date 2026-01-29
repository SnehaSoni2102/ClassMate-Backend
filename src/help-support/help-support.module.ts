import { Module } from '@nestjs/common';
import { HelpSupportService } from './help-support.service';
import { HelpSupportController } from './help-support.controller';
import { helpSupportModule, helpSupportSchema } from './help-support.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { authModule, authSchema } from 'src/users/users.schema';
import { JwtStrategy } from 'guards/jwtStrategy.guards';

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
      { name: helpSupportModule.name, schema: helpSupportSchema },
      { name: authModule.name, schema: authSchema },
    ]),
  ],
  providers: [HelpSupportService, JwtStrategy],
  controllers: [HelpSupportController],
  exports: [JwtModule],
})
export class HelpSupportModule {}
