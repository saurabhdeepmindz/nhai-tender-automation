import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get vendor dashboard summary stats' })
  async getDashboard() {
    return this.vendorsService.getDashboard();
  }

  @Get('rfps')
  @ApiOperation({ summary: 'List RFPs available to vendors' })
  async getRfps() {
    return this.vendorsService.getRfps();
  }

  @Get('queries')
  @ApiOperation({ summary: 'List submitted vendor queries' })
  async getQueries() {
    return this.vendorsService.getQueries();
  }
}
