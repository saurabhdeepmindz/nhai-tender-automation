import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rfp } from './entities/rfp.entity';
import { Query } from '../queries/entities/query.entity';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';

@Module({
  imports: [TypeOrmModule.forFeature([Rfp, Query])],
  controllers: [VendorsController],
  providers: [VendorsService],
})
export class VendorsModule {}
