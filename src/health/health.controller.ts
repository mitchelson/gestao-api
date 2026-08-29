import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      db: 'pending',
      version: process.env.npm_package_version ?? '0.1.0',
    };
  }
}
