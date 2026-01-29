import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { pricingPlansModule, pricingPlansSchema } from './pricing.schema';
import { authModule, authSchema } from 'src/users/users.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: pricingPlansModule.name, schema: pricingPlansSchema },
    ]),
    MongooseModule.forFeature([{ name: authModule.name, schema: authSchema }]),
  ],
  controllers: [PricingController],
  providers: [PricingService],
})
export class PricingModule {}
