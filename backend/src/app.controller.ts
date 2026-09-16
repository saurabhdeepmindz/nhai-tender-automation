import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Get API information and available endpoints' })
  getApiInfo() {
    return {
      message: 'NHAI Tender Query Automation System API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      documentation: '/api/docs',
      endpoints: {
        prebidQueries: '/api/prebid-queries',
        vectorization: '/api/vectorization',
        admin: '/api/admin/vectorization',
        health: '/api/health'
      },
      status: 'operational'
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
}
